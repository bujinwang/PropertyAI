import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    const token = authorization.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = payload as any;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const authenticateToken = isAuthenticated;

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authorization.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const isOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.role !== UserRole.OWNER) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
