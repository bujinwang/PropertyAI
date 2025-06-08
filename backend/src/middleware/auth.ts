import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface for requests with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware
 * Validates JWT token from the request headers and attaches the decoded user to the request object
 */
export const auth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string;
      email: string;
      role: string;
    };
    
    // Set the user in request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth; 