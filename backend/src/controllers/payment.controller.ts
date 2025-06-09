import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import logger from '../utils/logger';

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { amount, currency, customerId } = req.body;

  if (!amount || !currency || !customerId) {
    return res.status(400).json({ error: 'Amount, currency, and customer ID are required' });
  }

  try {
    const paymentIntent = await paymentService.createPaymentIntent(amount, currency, customerId);
    res.status(200).json(paymentIntent);
  } catch (error) {
    logger.error(`Error creating payment intent: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleSuccessfulPayment = async (req: Request, res: Response) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Payment intent ID is required' });
  }

  try {
    const transaction = await paymentService.handleSuccessfulPayment(paymentIntentId);
    res.status(200).json(transaction);
  } catch (error) {
    logger.error(`Error handling successful payment: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
