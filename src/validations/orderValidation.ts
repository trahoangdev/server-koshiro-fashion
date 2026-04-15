import { z } from 'zod';

export const createOrderSchema = z.object({
    body: z.object({
        items: z.array(
            z.object({
                productId: z.string().min(1, 'Product ID is required'),
                quantity: z.number().int().positive('Quantity must be positive'),
                size: z.string().optional(),
                color: z.string().optional(),
            })
        ).min(1, 'Order must have at least one item'),
        shippingAddress: z.object({
            name: z.string().min(1, 'Name is required'),
            phone: z.string().min(1, 'Phone is required'),
            address: z.string().min(1, 'Address is required'),
            city: z.string().min(1, 'City is required'),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
        }),
        billingAddress: z.object({
            name: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
        }).optional(),
        paymentMethod: z.string().min(1, 'Payment method is required'),
        notes: z.string().optional(),
        couponCode: z.string().optional(),
        referralCode: z.string().optional(),
        // Admin specific optional fields
        status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned', 'refunded']).optional(),
        paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
        trackingNumber: z.string().optional(),
        userId: z.string().optional(), // For admin creating order for user
    }),
});

export const createGuestOrderSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required'),
        items: z.array(
            z.object({
                productId: z.string().min(1, 'Product ID is required'),
                quantity: z.number().int().positive('Quantity must be positive'),
                size: z.string().optional(),
                color: z.string().optional(),
            })
        ).min(1, 'Order must have at least one item'),
        shippingAddress: z.object({
            name: z.string().min(1, 'Name is required'),
            phone: z.string().min(1, 'Phone is required'),
            address: z.string().min(1, 'Address is required'),
            city: z.string().min(1, 'City is required'),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
        }),
        billingAddress: z.object({
            name: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
        }).optional(),
        paymentMethod: z.string().min(1, 'Payment method is required'),
        notes: z.string().optional(),
        couponCode: z.string().optional(),
        referralCode: z.string().optional(),
    }),
});

export const updateOrderStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Order ID is required")
    }),
    body: z.object({
        status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned', 'refunded']).optional(),
        paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
        notes: z.string().optional()
    })
});
