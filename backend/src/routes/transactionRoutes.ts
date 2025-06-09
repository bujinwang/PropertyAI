import { Router } from 'express';
import TransactionController from '../controllers/transactionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware.protect, TransactionController.getAllTransactions);
router.post('/', authMiddleware.protect, TransactionController.createTransaction);
router.get('/:id', authMiddleware.protect, TransactionController.getTransactionById);
router.put('/:id', authMiddleware.protect, TransactionController.updateTransaction);
router.delete('/:id', authMiddleware.protect, TransactionController.deleteTransaction);

export default router;
