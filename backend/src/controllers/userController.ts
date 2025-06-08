import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Generic User CRUD

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        ...req.body,
        password: hashedPassword,
        role: role || UserRole.USER,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: req.body,
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}


// Tenant-specific controllers (if needed, or can be merged into generic user controllers with role checks)

export const createTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantData = { ...req.body, role: UserRole.TENANT };
    const tenant = await prisma.user.create({
      data: tenantData,
    });
    res.status(201).json(tenant);
  } catch (error) {
    next(error);
  }
};

export const getTenants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.user.findMany({
      where: { role: UserRole.TENANT },
    });
    res.json(tenants);
  } catch (error) {
    next(error);
  }
};

export const getTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.user.findFirst({
      where: { id, role: UserRole.TENANT },
    });
    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }
    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

export const updateTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.user.update({
      where: { id },
      data: req.body,
    });
    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

export const deleteTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
