import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateMFASecret, verifyTOTP } from '../services/mfaService';
import { AppError } from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export const setupMFA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req as any).user.id } });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const { secret, qrCode } = await generateMFASecret(user.email);

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: secret },
    });

    res.json({ secret, qrCode });
  } catch (error) {
    next(error);
  }
};

export const enableMFA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: (req as any).user.id } });

    if (!user || !user.mfaSecret) {
      return next(new AppError('MFA not set up', 400));
    }

    const isValid = verifyTOTP(user.mfaSecret, token);

    if (!isValid) {
      return next(new AppError('Invalid MFA token', 400));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });

    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    next(error);
  }
};

export const disableMFA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: (req as any).user.id } });

    if (!user || !user.mfaSecret) {
      return next(new AppError('MFA not set up', 400));
    }

    const isValid = verifyTOTP(user.mfaSecret, token);

    if (!isValid) {
      return next(new AppError('Invalid MFA token', 400));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    next(error);
  }
};
