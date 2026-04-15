import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/auth';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';

// Type for populated product in cart
interface PopulatedProduct {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  [key: string]: unknown;
}

const normalizeVariant = (value?: string) => (value || '').trim();

const findCartItemIndex = (
  items: Array<{ productId: { toString(): string }; size?: string; color?: string }>,
  productId: string,
  size?: string,
  color?: string
) => {
  const normalizedSize = normalizeVariant(size);
  const normalizedColor = normalizeVariant(color);
  const hasVariant = size !== undefined || color !== undefined;

  return items.findIndex((item) => {
    if (item.productId.toString() !== productId) return false;
    if (!hasVariant) return true;

    return normalizeVariant(item.size) === normalizedSize &&
      normalizeVariant(item.color) === normalizedColor;
  });
};

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
    
    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      model: 'Product',
      match: { isActive: true }
    });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    // Filter out inactive products and transform data for frontend
    const activeItems = cart.items
      .filter(item => item.productId)
      .map(item => {
        const product = item.productId as unknown as PopulatedProduct;
        return {
          productId: item.productId._id || item.productId,
          product: product,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        };
      });

    const total = activeItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.json({
      items: activeItems,
      total
    });});
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
    const { productId, quantity = 1, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if the exact product variant is already in cart
    const existingItemIndex = findCartItemIndex(cart.items, productId, size, color);

    if (existingItemIndex > -1) {
      const nextQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < nextQuantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }

      // Update existing item
      cart.items[existingItemIndex].quantity = nextQuantity;
      cart.items[existingItemIndex].size = normalizeVariant(size) || undefined;
      cart.items[existingItemIndex].color = normalizeVariant(color) || undefined;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        size: normalizeVariant(size) || undefined,
        color: normalizeVariant(color) || undefined
      });
    }

    await cart.save();

    res.status(201).json({ message: 'Product added to cart successfully' });});
export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
    const { productId } = req.params;
    const { quantity, size, color } = req.body;

    if (quantity !== undefined && quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = findCartItemIndex(cart.items, productId, size, color);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Product variant not found in cart' });
    }

    // Check stock if updating quantity
    if (quantity !== undefined) {
      const product = await Product.findById(productId);
      if (!product || product.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    if (size !== undefined) {
      cart.items[itemIndex].size = normalizeVariant(size) || undefined;
    }

    if (color !== undefined) {
      cart.items[itemIndex].color = normalizeVariant(color) || undefined;
    }

    await cart.save();

    res.json({ message: 'Cart item updated successfully' });});
export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
    const { productId } = req.params;
    const { size, color } = req.body || {};

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = findCartItemIndex(cart.items, productId, size, color);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Product variant not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.json({ message: 'Product removed from cart successfully' });});
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      // If cart doesn't exist, create empty one and return success
      cart = new Cart({ userId, items: [] });
      await cart.save();
      return res.json({ message: 'Cart cleared successfully' });
    }

    // Clear all items from cart
    cart.items = [];
    await cart.save();

    res.json({ message: 'Cart cleared successfully' });});
