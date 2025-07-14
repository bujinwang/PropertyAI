import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import * as backgroundCheckService from '../services/backgroundCheckService';

const prisma = new PrismaClient();

export const performCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.body;
    const application = await prisma.application.findUnique({ where: { id: applicationId } });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    const checkResult = await backgroundCheckService.performBackgroundCheck(application);
    res.json(checkResult);
  } catch (error) {
    next(error);
  }
};
