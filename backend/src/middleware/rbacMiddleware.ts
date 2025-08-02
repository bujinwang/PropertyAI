import { Request, Response, NextFunction } from 'express';
import { UserRole, User } from '@prisma/client';

export const rbacMiddleware = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = req.user as User;
    if (roles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  };
};
