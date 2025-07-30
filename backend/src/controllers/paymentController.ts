import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';

class PaymentController {
  async createCustomer(req: Request, res: Response) {
    try {
      const customer = await paymentService.createCustomer(
        { email: req.body.email, name: req.body.name }
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
      const signature = req.headers['stripe-signature'] as string;
      await paymentService.processPaymentWebhook(req.body, signature);
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

  async createRefund(req: Request, res: Response) {
    try {
      const refund = await paymentService.createRefund(req.body);
      res.status(201).json(refund);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async attachPaymentMethod(req: Request, res: Response) {
    try {
      const { customerId, paymentMethodId } = req.body;
      await paymentService.attachPaymentMethod(customerId, paymentMethodId);
      res.status(200).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomerPaymentMethods(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const paymentMethods = await paymentService.getCustomerPaymentMethods(customerId);
      res.status(200).json(paymentMethods);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createSetupIntent(req: Request, res: Response) {
    try {
      const { customerId } = req.body;
      const clientSecret = await paymentService.createSetupIntent(customerId);
      res.status(201).json({ clientSecret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSubscriptionDetails(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params;
      const subscription = await paymentService.getSubscriptionDetails(subscriptionId);
      res.status(200).json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancelSubscription(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params;
      const { prorate } = req.body;
      const subscription = await paymentService.cancelSubscription(subscriptionId, prorate);
      res.status(200).json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateSubscription(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params;
      const { items } = req.body;
      const subscription = await paymentService.updateSubscription(subscriptionId, items);
      res.status(200).json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createInvoice(req: Request, res: Response) {
    try {
      const { customerId, items } = req.body;
      const invoice = await paymentService.createInvoice(customerId, items);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomerPortalSession(req: Request, res: Response) {
    try {
      const { customerId, returnUrl } = req.body;
      const sessionUrl = await paymentService.getCustomerPortalSession(customerId, returnUrl);
      res.status(200).json({ url: sessionUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async calculateFees(req: Request, res: Response) {
    try {
      const { amount } = req.body;
      const fees = await paymentService.calculateFees(amount);
      res.status(200).json(fees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PaymentController();
