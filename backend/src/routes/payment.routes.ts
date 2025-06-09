import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/handle-successful-payment', paymentController.handleSuccessfulPayment);

export default router;
