import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await prisma.transaction.create({
      data: req.body,
    });
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await prisma.transaction.findMany();
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.update({
      where: { id },
      data: req.body,
    });
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
