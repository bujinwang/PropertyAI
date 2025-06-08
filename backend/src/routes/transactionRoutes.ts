import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getTransactions).post(protect, createTransaction);
router
  .route('/:id')
  .get(protect, getTransaction)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

export default router;
