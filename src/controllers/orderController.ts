import { Request, Response } from 'express';
import { Order, generateOrderNumber } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import Promotion from '../models/Promotion';



import { asyncHandler } from '../utils/errorHandler';

// Get all orders (admin)
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    userId,
    orderNumber,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter object
  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  }

  if (userId) {
    filter.userId = userId;
  }

  if (orderNumber) {
    filter.orderNumber = { $regex: orderNumber, $options: 'i' };
  }

  // Build sort object
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const orders = await Order.find(filter)
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name nameEn nameJa images cloudinaryImages')
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Order.countDocuments(filter);

  res.json({
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// Get user orders
export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const orders = await Order.find({ userId })
    .populate('items.productId', 'name nameEn nameJa images cloudinaryImages')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Order.countDocuments({ userId });

  res.json({
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// Get single order
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const order = await Order.findById(id)
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name nameEn nameJa images cloudinaryImages');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Check if user is authorized to view this order
  const isAdmin = req.user?.role === 'admin';
  const orderUserId = order.userId ? (order.userId as any)._id?.toString() || order.userId.toString() : null;

  if (!isAdmin && orderUserId !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json({ order });
});

// Track order by order number (public route)
export const trackOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber } = req.query;

  if (!orderNumber || typeof orderNumber !== 'string') {
    return res.status(400).json({ message: 'Order number is required' });
  }

  const order = await Order.findOne({ orderNumber: { $regex: orderNumber, $options: 'i' } })
    .populate('items.productId', 'name nameEn nameJa images cloudinaryImages');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({ order });
});

// Track order by email (public route)
export const trackOrderByEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.params;

  // Find orders by both userId (populated email) and guestEmail
  const userOrders = await Order.find({ userId: { $exists: true } })
    .populate({
      path: 'userId',
      match: { email: email },
      select: 'name email phone'
    })
    .populate('items.productId', 'name nameEn nameJa images cloudinaryImages')
    .sort({ createdAt: -1 });

  // Filter out orders where userId didn't match
  const matchedUserOrders = userOrders.filter(order => order.userId && (order.userId as any).email === email);

  // Find guest orders by guestEmail
  const guestOrders = await Order.find({
    guestEmail: email.toLowerCase().trim(),
    isGuestOrder: true
  })
    .populate('items.productId', 'name nameEn nameJa images cloudinaryImages')
    .sort({ createdAt: -1 });

  // Combine and sort
  const allOrders = [...matchedUserOrders, ...guestOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Limit to last 5 orders

  if (!allOrders || allOrders.length === 0) {
    return res.status(404).json({ message: 'No orders found for this email' });
  }

  res.json(allOrders);
});

// Create new order
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  console.log('[CreateOrder] Request received');
  if (!req.user) {
    console.warn('[CreateOrder] No user in request');
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userRole = req.user.role;
  const {
    userId: requestedUserId,
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    notes,
    status,
    paymentStatus,
    trackingNumber,
    couponCode,
    referralCode
  } = req.body;

  console.log('[CreateOrder] Body parsed. Items:', items?.length, 'Coupon:', couponCode);

  // Determine the actual userId to use
  let userId: string;
  if (userRole === 'admin' && requestedUserId) {
    // Admin creating order for another user
    userId = requestedUserId;
  } else {
    // Customer creating order for themselves
    userId = req.user.id;
  }

  // Calculate total and validate products
  console.log('[CreateOrder] Validating items for user:', userId);
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      console.error(`[CreateOrder] Product ${item.productId} not found`);
      return res.status(400).json({ message: `Product ${item.productId} not found` });
    }

    if (!product.isActive) {
      console.error(`[CreateOrder] Product ${product.name} inactive`);
      return res.status(400).json({ message: `Product ${product.name} is not available` });
    }

    if (product.stock < item.quantity) {
      console.error(`[CreateOrder] Insufficient stock. Stock: ${product.stock}, Req: ${item.quantity}`);
      return res.status(400).json({
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
      });
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      productId: product._id,
      name: product.nameEn || product.name,
      nameVi: product.name,
      quantity: item.quantity,
      price: product.price,
      size: item.size,
      color: item.color
    });

    // Update product stock
    console.log(`[CreateOrder] Updating stock for ${product.name}`);
    await Product.findByIdAndUpdate(product._id, {
      $inc: { stock: -item.quantity }
    });
  }

  console.log(`[CreateOrder] Subtotal: ${subtotal}`);

  // Calculate Discount, Shipping, Tax, and Total
  let discountAmount = 0;
  let shippingCost = subtotal > 2000000 ? 0 : 50000;
  let taxAmount = subtotal * 0.1; // 10% tax

  // Apply Coupon Code
  if (couponCode) {
    console.log(`[CreateOrder] Applying coupon: ${couponCode}`);
    const promotion = await Promotion.findOne({ code: couponCode.toUpperCase() });

    if (promotion && promotion.isActive) {
      // Validate dates
      const now = new Date();
      const isValidDate = now >= promotion.startDate && now <= promotion.endDate;
      const isValidLimit = !promotion.usageLimit || promotion.usedCount < promotion.usageLimit;
      const isValidMinOrder = !promotion.minOrderAmount || subtotal >= promotion.minOrderAmount;

      if (isValidDate && isValidLimit && isValidMinOrder) {
        if (promotion.type === 'percentage') {
          discountAmount = (subtotal * promotion.value) / 100;
          if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
            discountAmount = promotion.maxDiscountAmount;
          }
        } else if (promotion.type === 'fixed') {
          discountAmount = promotion.value;
        } else if (promotion.type === 'free_shipping') {
          shippingCost = 0;
        }

        // Increment used count
        console.log(`[CreateOrder] Incrementing promo usage`);
        await Promotion.findByIdAndUpdate(promotion._id, { $inc: { usedCount: 1 } });
      } else {
        console.warn(`[CreateOrder] Invalid promo conditions. Date:${isValidDate}, Limit:${isValidLimit}, Min:${isValidMinOrder}`);
      }
    }
  }

  const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;
  console.log(`[CreateOrder] Final Total: ${totalAmount}`);

  // Generate unique order number
  const orderNumber = await generateOrderNumber();
  console.log(`[CreateOrder] Order Number: ${orderNumber}`);

  // Prepare order data
  const orderData: any = {
    orderNumber,
    userId,
    items: orderItems,
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    totalAmount: totalAmount > 0 ? totalAmount : 0,
    shippingAddress,
    billingAddress,
    paymentMethod,
    notes,
    couponCode,
    referralCode
  };

  // Add admin-specific fields if provided
  if (userRole === 'admin') {
    if (status) orderData.status = status;
    if (paymentStatus) orderData.paymentStatus = paymentStatus;
    if (trackingNumber) orderData.trackingNumber = trackingNumber;
  }

  console.log('[CreateOrder] Saving order...');
  const order = new Order(orderData);

  await order.save();
  console.log('[CreateOrder] Order saved!');

  // Update user statistics
  await User.findByIdAndUpdate(userId, {
    $inc: {
      totalOrders: 1,
      totalSpent: totalAmount > 0 ? totalAmount : 0
    }
  });

  res.status(201).json({
    message: 'Order created successfully',
    order
  });
});

// Create guest order (no authentication required)
export const createGuestOrder = asyncHandler(async (req: Request, res: Response) => {
  console.log('[CreateGuestOrder] Request received');
  const {
    email,
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    notes,
    couponCode,
    referralCode
  } = req.body;

  // Validate email




  // Calculate total and validate products
  console.log('[CreateOrder] Validating items:', items?.length);
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      console.error(`[CreateOrder] Product ${item.productId} not found`);
      return res.status(400).json({ message: `Product ${item.productId} not found` });
    }

    if (!product.isActive) {
      console.error(`[CreateOrder] Product ${product.name} inactive`);
      return res.status(400).json({ message: `Product ${product.name} is not available` });
    }

    if (product.stock < item.quantity) {
      console.error(`[CreateOrder] Insufficient stock for ${product.name}`);
      return res.status(400).json({
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
      });
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      productId: product._id,
      name: product.nameEn || product.name,
      nameVi: product.name,
      quantity: item.quantity,
      price: product.price,
      size: item.size,
      color: item.color
    });

    // Update product stock
    await Product.findByIdAndUpdate(product._id, {
      $inc: { stock: -item.quantity }
    });
  }

  // Calculate Discount, Shipping, Tax, and Total
  let discountAmount = 0;
  let shippingCost = subtotal > 2000000 ? 0 : 50000;
  let taxAmount = subtotal * 0.1; // 10% tax

  // Apply Coupon Code
  if (couponCode) {
    const promotion = await Promotion.findOne({ code: couponCode.toUpperCase() });

    if (promotion && promotion.isActive) {
      // Validate dates
      const now = new Date();
      const isValidDate = now >= promotion.startDate && now <= promotion.endDate;
      const isValidLimit = !promotion.usageLimit || promotion.usedCount < promotion.usageLimit;
      const isValidMinOrder = !promotion.minOrderAmount || subtotal >= promotion.minOrderAmount;

      if (isValidDate && isValidLimit && isValidMinOrder) {
        if (promotion.type === 'percentage') {
          discountAmount = (subtotal * promotion.value) / 100;
          if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
            discountAmount = promotion.maxDiscountAmount;
          }
        } else if (promotion.type === 'fixed') {
          discountAmount = promotion.value;
        } else if (promotion.type === 'free_shipping') {
          shippingCost = 0;
        }

        // Increment used count
        await Promotion.findByIdAndUpdate(promotion._id, { $inc: { usedCount: 1 } });
      }
    }
  }

  const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

  // Generate unique order number
  const orderNumber = await generateOrderNumber();

  // Prepare order data for guest
  const orderData: any = {
    orderNumber,
    guestEmail: email.toLowerCase().trim(),
    isGuestOrder: true,
    items: orderItems,
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    totalAmount: totalAmount > 0 ? totalAmount : 0,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    notes,
    couponCode,
    referralCode
  };

  const order = new Order(orderData);
  await order.save();

  res.status(201).json({
    message: 'Guest order created successfully',
    order
  });
});

// Update order status (admin)
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, paymentStatus, notes } = req.body;

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;
  if (notes !== undefined) updateData.notes = notes;

  const order = await Order.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name nameEn nameJa images cloudinaryImages');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({
    message: 'Order status updated successfully',
    order
  });
});

// Cancel order
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const filter: Record<string, unknown> = { _id: id };
  if (userRole !== 'admin') {
    filter.userId = userId;
  }

  const order = await Order.findOne(filter);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Only allow cancellation of pending orders
  if (order.status !== 'pending') {
    return res.status(400).json({
      message: 'Only pending orders can be cancelled'
    });
  }

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity }
    });
  }

  // Update order status
  order.status = 'cancelled';
  await order.save();

  // Update user statistics
  await User.findByIdAndUpdate(order.userId, {
    $inc: {
      totalOrders: -1,
      totalSpent: -order.totalAmount
    }
  });

  res.json({
    message: 'Order cancelled successfully',
    order
  });
});

// Delete order (Admin only)
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const { id } = req.params;
  const userRole = req.user.role;

  // Only admin can delete orders
  if (userRole !== 'Admin' && userRole !== 'Super Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Only allow deletion of cancelled or very old completed orders
  if (order.status !== 'cancelled' && order.status !== 'completed') {
    return res.status(400).json({
      message: 'Only cancelled or completed orders can be deleted'
    });
  }

  // If deleting a cancelled order, restore product stock
  if (order.status === 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
  }

  // Delete the order
  await Order.findByIdAndDelete(id);

  // Update user statistics if needed
  if (order.status === 'completed') {
    await User.findByIdAndUpdate(order.userId, {
      $inc: {
        totalOrders: -1,
        totalSpent: -order.totalAmount
      }
    });
  }

  res.json({
    message: 'Order deleted successfully'
  });
});

// Update order (Admin only)
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const { id } = req.params;
  const updateData = req.body;

  const order = await Order.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({
    message: 'Order updated successfully',
    order
  });
});

// Get order statistics (admin)
export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const processingOrders = await Order.countDocuments({ status: 'processing' });
  const completedOrders = await Order.countDocuments({ status: 'completed' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

  const totalRevenue = await Order.aggregate([
    { $match: { status: 'completed', paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.json({
    stats: {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    }
  });
});
