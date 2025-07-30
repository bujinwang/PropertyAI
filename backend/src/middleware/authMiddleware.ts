import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';
import { prisma } from '../config/database';

export const authMiddleware = {
  protect: async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        if (!decoded) {
          return res.status(401).json({ message: 'Not authorized, token failed' });
        }

        const user = await prisma.user.findUnique({
          where: { id: (decoded as any).id },
        });

        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
      } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  },

  admin: (req: Request, res: Response, next: NextFunction) => {
    if (req.user && (req.user as User).role === UserRole.ADMIN) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as an admin' });
    }
  },

  checkRole: (roles: Array<UserRole>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user' });
      }

      const userRole = (req.user as User).role;
      if (roles.includes(userRole)) {
        next();
      } else {
        res.status(403).json({ message: `Not authorized, requires one of the following roles: ${roles.join(', ')}` });
      }
    };
  }
};
