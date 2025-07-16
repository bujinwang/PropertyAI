import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import logger from '../utils/logger';

class PaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    const { amount, currency, customerId } = req.body;

    if (!amount || !currency || !customerId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      const paymentIntent = await paymentService.createPaymentIntent(amount, currency, customerId);
      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      logger.error(`Error creating PaymentIntent: ${error}`);
      res.status(500).json({ error: 'Failed to create PaymentIntent.' });
    }
  }

  async processPayment(req: Request, res: Response) {
    const { leaseId } = req.params;
    const { paymentMethodId, amount, currency } = req.body;
    
    if (!leaseId) {
      return res.status(400).json({ error: 'Lease ID is required.' });
    }
    if (!paymentMethodId || !amount || !currency) {
      return res.status(400).json({ error: 'Payment method ID, amount, and currency are required.' });
    }

    try {
      await paymentService.processPayment(paymentMethodId, amount, currency);
      res.status(200).json({ message: 'Payment processed successfully.' });
    } catch (error) {
      logger.error(`Error processing payment: ${error}`);
      res.status(500).json({ error: 'Failed to process payment.' });
    }
  }
}

export const paymentController = new PaymentController();
