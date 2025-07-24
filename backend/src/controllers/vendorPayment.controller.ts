import { Request, Response } from 'express';
import { vendorPaymentService } from '../services/vendorPayment.service';
import logger from '../utils/logger';

class VendorPaymentController {
  async initiatePayment(req: Request, res: Response) {
    const { workOrderId } = req.body;

    if (!workOrderId) {
      return res.status(400).json({ error: 'Work order ID is required.' });
    }

    try {
      const payment = await vendorPaymentService.initiatePayment(workOrderId);
      res.status(200).json(payment);
    } catch (error) {
      logger.error(`Error initiating payment: ${error}`);
      res.status(500).json({ error: 'Failed to initiate payment.' });
    }
  }

  async getPaymentHistory(req: Request, res: Response) {
    const { vendorId } = req.params;

    try {
      const history = await vendorPaymentService.getPaymentHistory(vendorId);
      res.status(200).json(history);
    } catch (error) {
      logger.error(`Error getting payment history: ${error}`);
      res.status(500).json({ error: 'Failed to get payment history.' });
    }
  }

  async handleStripeWebhook(req: Request, res: Response) {
    const event = req.body;

    try {
      await vendorPaymentService.handleStripeWebhook(event);
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error(`Error handling Stripe webhook: ${error}`);
      res.status(500).json({ error: 'Failed to handle Stripe webhook.' });
    }
  }
}

export const vendorPaymentController = new VendorPaymentController();