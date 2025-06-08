import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export const createMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: req.body,
    });
    res.status(201).json(maintenanceRequest);
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenanceRequests = await prisma.maintenanceRequest.findMany();
    res.json(maintenanceRequests);
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!maintenanceRequest) {
      return next(new AppError('Maintenance request not found', 404));
    }
    res.json(maintenanceRequest);
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const maintenanceRequest = await prisma.maintenanceRequest.update({
      where: { id },
      data: req.body,
    });
    res.json(maintenanceRequest);
  } catch (error) {
    next(error);
  }
};

export const deleteMaintenanceRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.maintenanceRequest.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
