import { Request, Response, NextFunction } from 'express';

// Define User interface for type safety
interface User {
  id: string;
  email: string;
  role: string;
}

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to check if user has admin privileges
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Check if user exists in request (should be set by authentication middleware)
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if user has admin role
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admin privileges required' });
      return;
    }

    // User is authenticated and has admin role
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error?.message || error);
    res.status(500).json({ message: 'Internal server error in auth middleware' });
  }
};

/**
 * Middleware to check if user is authenticated
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Check if user exists in request (should be set by authentication middleware)
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // User is authenticated
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error?.message || error);
    res.status(500).json({ message: 'Internal server error in auth middleware' });
  }
};

// Export middleware functions
export default {
  requireAdmin,
  requireAuth
}; 