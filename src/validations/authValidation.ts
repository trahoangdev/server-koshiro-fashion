import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters long'),
        name: z.string().min(2, 'Name must be at least 2 characters long'),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const adminLoginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        preferences: z.object({
            language: z.string().optional(),
            currency: z.string().optional(),
            emailNotifications: z.boolean().optional(),
            smsNotifications: z.boolean().optional(),
            marketingEmails: z.boolean().optional()
        }).optional()
    })
});
