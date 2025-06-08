import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export const createLease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lease = await prisma.lease.create({
      data: req.body,
    });
    res.status(201).json(lease);
  } catch (error) {
    next(error);
  }
};

export const getLeases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leases = await prisma.lease.findMany();
    res.json(leases);
  } catch (error) {
    next(error);
  }
};

export const getLease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lease = await prisma.lease.findUnique({ where: { id } });
    if (!lease) {
      return next(new AppError('Lease not found', 404));
    }
    res.json(lease);
  } catch (error) {
    next(error);
  }
};

export const updateLease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lease = await prisma.lease.update({
      where: { id },
      data: req.body,
    });
    res.json(lease);
  } catch (error) {
    next(error);
  }
};

export const deleteLease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.lease.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
