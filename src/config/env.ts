import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const trustProxySchema = z
    .string()
    .optional()
    .default('false')
    .transform((value, ctx) => {
        const normalizedValue = value.trim().toLowerCase();

        if (normalizedValue === 'false' || normalizedValue === '0') {
            return false;
        }

        if (/^\d+$/.test(normalizedValue)) {
            return Number(normalizedValue);
        }

        if (['loopback', 'linklocal', 'uniquelocal'].includes(normalizedValue)) {
            return normalizedValue;
        }

        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'TRUST_PROXY must be false, 0, a hop count number, loopback, linklocal, or uniquelocal',
        });
        return z.NEVER;
    });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((val) => parseInt(val, 10)).default(3000),

    // Database
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

    // JWT
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRE: z.string().default('7d'),

    // URLs
    FRONTEND_URL: z.string().optional(),
    PRODUCTION_FRONTEND_URL: z.string().optional(),
    TRUST_PROXY: trustProxySchema,

    // Email (Optional)
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).optional(),
});

export type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map((issue) => {
                return `${issue.path.join('.')}: ${issue.message}`;
            });
            console.error('❌ Invalid environment variables:', missingVars.join('\n'));
            throw new Error('Invalid environment variables');
        }
        throw error;
    }
};

export const env = validateEnv();
