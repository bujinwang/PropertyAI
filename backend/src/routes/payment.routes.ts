import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { isAuthenticated, isOwner } from '../middleware/auth';

const router = Router();

router.get(
  '/transactions/pending',
  isAuthenticated,
  isOwner,
  paymentController.getPendingTransactions
);

router.get(
  '/vendor-payments/pending',
  isAuthenticated,
  isOwner,
  paymentController.getPendingVendorPayments
);

router.post(
  '/transactions/:id/approve',
  isAuthenticated,
  isOwner,
  paymentController.approveTransaction
);

router.post(
  '/transactions/:id/reject',
  isAuthenticated,
  isOwner,
  paymentController.rejectTransaction
);

router.post(
  '/vendor-payments/:id/approve',
  isAuthenticated,
  isOwner,
  paymentController.approveVendorPayment
);

router.post(
  '/vendor-payments/:id/reject',
  isAuthenticated,
  isOwner,
  paymentController.rejectVendorPayment
);

export default router;
