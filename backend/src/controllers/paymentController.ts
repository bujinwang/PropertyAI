import { Request, Response } from 'express';
import PaymentService from '../services/paymentService';

class PaymentController {
  async createCustomer(req: Request, res: Response) {
    try {
      const customer = await PaymentService.createCustomer(
        req.body.email,
        req.body.name
      );
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createPaymentIntent(req: Request, res: Response) {
    try {
      const paymentIntent = await PaymentService.createPaymentIntent(
        req.body.amount,
        req.body.currency
      );
      res.status(201).json(paymentIntent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createSubscription(req: Request, res: Response) {
    try {
      const subscription = await PaymentService.createSubscription(
        req.body.customerId,
        req.body.priceId
      );
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const event = req.body;
      if (event.type === 'payment_intent.payment_failed') {
        await PaymentService.handleFailedPayment(event.data.object.id);
      }
      res.status(200).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PaymentController();
