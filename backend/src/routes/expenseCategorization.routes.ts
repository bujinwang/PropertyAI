import { Router } from 'express';
import * as expenseCategorizationController from '../controllers/expenseCategorization.controller';

const router = Router();

router.post('/:transactionId', expenseCategorizationController.categorizeExpense);

export default router;
