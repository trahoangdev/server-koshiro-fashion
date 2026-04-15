import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Helper function to check if request should skip rate limiting
 */
const shouldSkipRateLimit = (req: Request): boolean => {
  // Health probes must remain available even when the API is saturated.
  const isHealthCheck = ['/health', '/api/health', '/status', '/api/status'].includes(req.path);
  if (isHealthCheck) {
    return true;
  }

  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const ip = req.ip || req.socket.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const commonRateLimitResponse = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60,
    timestamp: new Date().toISOString()
  });
};

/**
 * General API rate limiter
 * Limits: 
 * - Development: Unlimited
 * - Production: 500 requests per 15 minutes per IP (increased from 100)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 10000, // Much higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: commonRateLimitResponse,
  skip: shouldSkipRateLimit,
  validate: {
    trustProxy: false
  }
});

/**
 * Auth endpoints rate limiter
 * Limits: 
 * - Development: 50 requests per 15 minutes
 * - Production: 10 requests per 15 minutes per IP
 * More restrictive for login/register endpoints to prevent brute force
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // Increased limit
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: 15 * 60,
      timestamp: new Date().toISOString()
    });
  },
  skip: shouldSkipRateLimit,
  // Use IP + email for more granular rate limiting
  keyGenerator: (req: Request) => {
    const email = String(req.body?.email || req.body?.username || '').trim().toLowerCase();
    return `${ipKeyGenerator(req.ip || 'unknown')}-${email}`;
  },
  validate: {
    trustProxy: false,
    ip: false
  }
});

/**
 * Admin endpoints rate limiter
 * Limits: 
 * - Development: Unlimited
 * - Production: 1000 requests per 15 minutes per IP
 * More lenient for admin operations
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // Much higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: commonRateLimitResponse,
  skip: shouldSkipRateLimit,
  validate: {
    trustProxy: false
  }
});

/**
 * Password reset rate limiter
 * Limits: 
 * - Development: 20 requests per hour
 * - Production: 5 requests per hour per IP
 * Very restrictive for security
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // Increased limit
  message: {
    success: false,
    message: 'Too many password reset requests from this IP, please try again later.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests from this IP, please try again later.',
      retryAfter: 60 * 60,
      timestamp: new Date().toISOString()
    });
  },
  skip: shouldSkipRateLimit,
  validate: {
    trustProxy: false
  }
});

/**
 * Product search/listing rate limiter
 * Limits: 
 * - Development: Unlimited
 * - Production: 1000 requests per 15 minutes per IP
 * More lenient for public product browsing
 */
export const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // Much higher limit in development
  message: {
    success: false,
    message: 'Too many product requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many product requests from this IP, please try again later.',
      retryAfter: 15 * 60,
      timestamp: new Date().toISOString()
    });
  },
  skip: shouldSkipRateLimit,
  validate: {
    trustProxy: false
  }
});
