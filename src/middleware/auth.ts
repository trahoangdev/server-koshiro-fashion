import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger';
import { UserRole } from '../constants/roles';
import { User } from '../models/User';
import { IRole } from '../models/Role';

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

const resolveFreshUserRole = async (req: Request, res: Response): Promise<string | null> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return null;
  }

  try {
    const user = await User.findById(req.user.id).populate('role');
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return null;
    }

    if (user.status && user.status !== 'active') {
      res.status(403).json({ message: 'User account is not active', status: user.status });
      return null;
    }

    const roleName = typeof user.role === 'string'
      ? user.role
      : (user.role as unknown as IRole)?.name;

    if (!roleName) {
      res.status(403).json({ message: 'User role is missing' });
      return null;
    }

    req.user.role = roleName;
    return roleName;
  } catch (error) {
    logger.error('Auth middleware - Failed to resolve current user role', error);
    res.status(500).json({ message: 'Failed to verify user permissions' });
    return null;
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userRole = await resolveFreshUserRole(req, res);
  if (!userRole) return;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      message: 'Admin access required',
      userRole: userRole,
      expectedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    });
  }

  next();
};

export const requireCustomer = async (req: Request, res: Response, next: NextFunction) => {
  const userRole = await resolveFreshUserRole(req, res);
  if (!userRole) return;

  if (userRole !== UserRole.CUSTOMER) {
    return res.status(403).json({
      message: 'Customer access required',
      userRole: userRole,
      expectedRole: UserRole.CUSTOMER
    });
  }

  next();
};

export const requireCustomerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userRole = await resolveFreshUserRole(req, res);
  if (!userRole) return;

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
  resolveFreshUserRole(req, res)
    .then((userRole) => {
      if (!userRole) return;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          message: 'Insufficient permissions',
          userRole: userRole,
          requiredRoles: roles
        });
      }

      next();
    })
    .catch(next);
};

// Async handler wrapper to catch errors
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

