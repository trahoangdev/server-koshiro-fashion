import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger';
import { UserRole } from '../constants/roles';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// AuthRequest type is now globally defined in src/types/express.d.ts
// export type { AuthRequest }; is no longer needed but kept for backward compatibility if imported elsewhere
export type AuthRequest = Request;

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  //   logger.debug('Auth middleware - Headers', { hasAuth: !!authHeader });
  //   logger.debug('Auth middleware - Token', { hasToken: !!token });

  if (!token) {
    // logger.debug('Auth middleware - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      name?: string;
    };
    // logger.debug('Auth middleware - Decoded token', { userId: decoded.userId, email: decoded.email, role: decoded.role });

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || '',
      role: decoded.role
    };
    next();
  } catch (error) {
    logger.error('Auth middleware - Token verification failed', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Handle both string and object role formats
  const userRole = typeof req.user.role === 'string' ? req.user.role : req.user.role?.name;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      message: 'Admin access required',
      userRole: userRole,
      expectedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    });
  }

  next();
};

export const requireCustomer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Handle both string and object role formats
  const userRole = typeof req.user.role === 'string' ? req.user.role : req.user.role?.name;

  if (userRole !== UserRole.CUSTOMER) {
    return res.status(403).json({
      message: 'Customer access required',
      userRole: userRole,
      expectedRole: UserRole.CUSTOMER
    });
  }

  next();
};

export const requireCustomerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Handle both string and object role formats
  const userRole = typeof req.user.role === 'string' ? req.user.role : req.user.role?.name;

  if (userRole !== UserRole.CUSTOMER && userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      message: 'Customer or admin access required',
      userRole: userRole,
      expectedRoles: [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    });
  }

  next();
};

export const authorizeRoles = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Handle both string and object role formats
  const userRole = typeof req.user.role === 'string' ? req.user.role : req.user.role?.name;

  if (!userRole || !roles.includes(userRole)) {
    return res.status(403).json({
      message: 'Insufficient permissions',
      userRole: userRole,
      requiredRoles: roles
    });
  }

  next();
};

// Async handler wrapper to catch errors
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

