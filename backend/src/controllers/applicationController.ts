import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export const createApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await prisma.application.create({
      data: req.body,
    });
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await prisma.application.findMany();
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return next(new AppError('Application not found', 404));
    }
    res.json(application);
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.update({
      where: { id },
      data: req.body,
    });
    res.json(application);
  } catch (error) {
    next(error);
  }
};

export const deleteApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.application.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
