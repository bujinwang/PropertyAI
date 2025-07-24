import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';

class PaymentController {
  async createCustomer(req: Request, res: Response) {
    try {
      const customer = await paymentService.createCustomer(
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
      const paymentIntent = await paymentService.createPaymentIntent(
        req.body.amount,
        req.body.currency,
        req.body.customerId
      );
      res.status(201).json(paymentIntent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createSubscription(req: Request, res: Response) {
    try {
      const subscription = await paymentService.createSubscription(
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
        await paymentService.handleFailedPayment(event.data.object.id);
      }
      res.status(200).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async collectDeposit(req: Request, res: Response) {
    try {
      const { leaseId, amount, currency } = req.body;
      const paymentIntent = await paymentService.collectDeposit(leaseId, amount, currency);
      res.status(201).json(paymentIntent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PaymentController();
