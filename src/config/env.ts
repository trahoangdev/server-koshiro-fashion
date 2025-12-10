import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

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
