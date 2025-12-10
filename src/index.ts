import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import { env } from './config/env';
import { connectDB } from './config/database';
import { apiLimiter, authLimiter, adminLimiter, passwordResetLimiter, productLimiter } from './middleware/rateLimit';
import { logger } from './lib/logger';
import { errorHandler } from './utils/errorHandler';
import morgan from 'morgan';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import reviewRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import activityRoutes from './routes/activity';
import notificationRoutes from './routes/notifications';
import settingsRoutes from './routes/settings';
import paymentMethodRoutes from './routes/paymentMethods';
import promotionRoutes from './routes/promotions';
import inventoryRoutes from './routes/inventory';
import adminShippingRoutes from './routes/adminShipping';
import adminPaymentsRoutes from './routes/adminPayments';
import flashSaleRoutes from './routes/flashSale';
import roleRoutes from './routes/roles';
import permissionRoutes from './routes/permissions';
import colorRoutes from './routes/colors';

const app = express();

// Port configuration
const PORT = env.PORT;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing for API
  hsts: env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
}));

// CORS configuration with validation
const allowedOrigins = [
  env.FRONTEND_URL || 'http://localhost:8080',
  // Only allow specific localhost ports in development
  ...(env.NODE_ENV === 'development' ? [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
  ] : [])
].filter(Boolean);

// Add production frontend URL if provided
if (env.PRODUCTION_FRONTEND_URL) {
  // @ts-ignore - filter(Boolean) above leaves strings but TS might doubt, actually explicit check handles it.
  allowedOrigins.push(env.PRODUCTION_FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // In production, require origin
    if (env.NODE_ENV === 'production' && !origin) {
      return callback(new Error('CORS: Origin required in production'), false);
    }

    // Allow requests with no origin only in development (for testing tools)
    if (!origin) {
      if (env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('CORS: Origin required'), false);
    }

    // @ts-ignore
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // Cache preflight requests for 24 hours
}));
// Request size limits (adjust based on needs)
app.use(express.json({ limit: '5mb' })); // Reduced from 10mb for security
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Data Sanitization again NoSQL Injection
app.use(mongoSanitize());


// Data Sanitization against XSS
app.use(xss());

// Swagger API Documentation
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Koshiro Fashion API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      admin: '/api/admin',
      roles: '/api/roles',
      permissions: '/api/permissions'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin/shipping', adminShippingRoutes);
app.use('/api/admin/payments', adminPaymentsRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/colors', colorRoutes);

// Error handling middleware - use centralized error handler (must be last)
app.use(errorHandler);

app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
));

// 404 handler
app.use('*', (req: Request, res: Response) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, { ip: req.ip });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      health: '/health',
      apiStatus: '/api/status',
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      admin: '/api/admin'
    }
  });
});

// Start server
const startServer = async () => {
  try {
    // Environment variables are validated on import of './config/env'

    // Connect to database
    await connectDB();

    // Start server
    await startServerWithPortHandling();

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const startServerWithPortHandling = async (attemptPort: number = PORT, maxAttempts: number = 5): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (attemptPort < 1 || attemptPort > 65535) {
      reject(new Error(`Invalid port: ${attemptPort}`));
      return;
    }

    server = app.listen(attemptPort, '0.0.0.0', () => {
      const address = server?.address();
      const actualPort = (address && typeof address === 'object' && 'port' in address)
        ? address.port
        : attemptPort;

      logger.info(`🚀 Koshiro Fashion API running on http://localhost:${actualPort}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      resolve();
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        if (attemptPort < PORT + maxAttempts) {
          server = null;
          startServerWithPortHandling(attemptPort + 1, maxAttempts)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error(`No available ports in range ${PORT}-${PORT + maxAttempts - 1}`));
        }
      } else if (error.code === 'EACCES') {
        reject(new Error(`Permission denied for port ${attemptPort}`));
      } else {
        reject(error);
      }
    });
  });
};

// Handle graceful shutdown
let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`🛑 ${signal} - Shutting down...`);

  if (server) {
    server.close((err) => {
      if (err) {
        process.exit(1);
      }
      logger.info('✅ Server stopped');
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 15000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`❌ Uncaught Exception: ${error.message}`);
  if (server && !isShuttingDown) {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('❌ Unhandled Rejection:', reason);
  if (server && !isShuttingDown) {
    gracefulShutdown('UNHANDLED_REJECTION');
  } else {
    process.exit(1);
  }
});

// Start the server
startServer();
