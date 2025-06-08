import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generatePasswordResetToken, verifyPasswordResetToken } from '../services/passwordResetService';
import AppError from '../middleware/errorMiddleware';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const resetToken = await generatePasswordResetToken(email);

    if (!resetToken) {
      return next(new AppError('User not found', 404));
    }

    // In a real application, you would send an email with the resetToken
    res.status(200).json({ message: 'Password reset token sent to email', resetToken });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const user = await verifyPasswordResetToken(token);

    if (!user) {
      return next(new AppError('Invalid or expired password reset token', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    next(error);
  }
};
