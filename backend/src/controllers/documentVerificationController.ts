import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import * as documentVerificationService from '../services/documentVerificationService';

const prisma = new PrismaClient();

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.body;
    const document = await prisma.document.findUnique({ where: { id: documentId } });

    if (!document) {
      return next(new AppError('Document not found', 404));
    }

    const verification = await documentVerificationService.verifyDocument(document);
    res.json(verification);
  } catch (error) {
    next(error);
  }
};
