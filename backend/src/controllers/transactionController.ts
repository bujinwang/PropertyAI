import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TransactionController {
  async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await prisma.transaction.findMany();
      res.status(200).json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createTransaction(req: Request, res: Response) {
    try {
      const transaction = await prisma.transaction.create({ data: req.body });
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTransactionById(req: Request, res: Response) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: req.params.id },
      });
      if (transaction) {
        res.status(200).json(transaction);
      } else {
        res.status(404).json({ message: 'Transaction not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTransaction(req: Request, res: Response) {
    try {
      const transaction = await prisma.transaction.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    try {
      await prisma.transaction.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TransactionController();
