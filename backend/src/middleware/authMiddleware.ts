import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ErrorWithStatus, AuthenticationError, AuthorizationError } from '../utils/errorUtils';

const prisma = new PrismaClient();

// Extended Request type to include user information
import { User } from '@prisma/client';

export const authMiddleware = {
  /**
   * Verify JWT token from Authorization header
   */
  verifyToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Authentication token is required');
      }
      
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        throw new AuthenticationError('Authentication token is required');
      }
      
      try {
        // Verify the token
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'your-secret-key'
        ) as jwt.JwtPayload;
        
        // Verify the user exists in the database
        // Verify the user exists in the database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        
        if (!user) {
          throw new AuthenticationError('User not found');
        }
        
        if (!user.isActive) {
          throw new AuthenticationError('User account is disabled');
        }
        
        // Add user information to request object
        req.user = user;
        
        
        next();
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          throw new AuthenticationError('Invalid token');
        }
        if (error instanceof jwt.TokenExpiredError) {
          throw new AuthenticationError('Token expired');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Check if user has one of the allowed roles
   */
  checkRole: (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User information not found');
        }
        
        const { role } = req.user;
        
        if (!allowedRoles.includes(role)) {
          throw new AuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  },
  
  /**
   * Check if user is the owner or has a specific role
   */
  checkOwnerOrRole: (resourceIdParam: string, allowedRoles: string[] = ['ADMIN']) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User information not found');
        }
        
        const { id: userId, role } = req.user;
        
        // Admin or other allowed roles bypass ownership check
        if (allowedRoles.includes(role)) {
          return next();
        }
        
        const resourceId = req.params[resourceIdParam];
        
        if (!resourceId) {
          throw new ErrorWithStatus(`Resource ID parameter '${resourceIdParam}' not found`, 400);
        }
        
        // Check ownership based on the resource type
        // This would need to be customized based on your data model
        let isOwner = false;
        
        switch (req.baseUrl) {
          case '/api/properties':
            const property = await prisma.property.findUnique({
              where: { id: resourceId },
              select: { ownerId: true, managerId: true }
            });
            isOwner = property?.ownerId === userId || property?.managerId === userId;
            break;
            
          case '/api/units':
            const unit = await prisma.unit.findUnique({
              where: { id: resourceId },
              select: { 
                property: {
                  select: { ownerId: true, managerId: true }
                },
                tenantId: true
              }
            });
            isOwner = unit?.property.ownerId === userId || 
                      unit?.property.managerId === userId || 
                      unit?.tenantId === userId;
            break;
            
          default:
            isOwner = false;
        }
        
        if (!isOwner) {
          throw new AuthorizationError('Access denied. You do not own this resource.');
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
};

export default authMiddleware; 