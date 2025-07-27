import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import { backgroundCheckService } from '../services/backgroundCheck.service';

const prisma = new PrismaClient();

export const performCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.body;
    const application = await prisma.application.findUnique({ where: { id: applicationId } });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    const transunionResult = await backgroundCheckService.runTransunionCheck(application.id);
    const experianResult = await backgroundCheckService.runExperianCheck(application.id);

    res.json({ transunionResult, experianResult });
  } catch (error) {
    next(error);
  }
};

export const backgroundCheckController = {
  performCheck
};
