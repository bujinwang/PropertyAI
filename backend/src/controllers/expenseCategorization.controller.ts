import { Request, Response } from 'express';
import { expenseCategorizationService } from '../services/expenseCategorization.service';
import logger from '../utils/logger';

export const categorizeExpense = async (req: Request, res: Response) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  try {
    const category = await expenseCategorizationService.categorizeExpense(transactionId);
    res.status(200).json({ category });
  } catch (error) {
    logger.error(`Error categorizing expense: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
