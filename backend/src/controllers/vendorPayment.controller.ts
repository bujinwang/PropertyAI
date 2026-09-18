import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '@prisma/client';
import { vendorPaymentService } from '../services/vendorPayment.service';
import { prisma } from '../config/database';
import logger from '../utils/logger';

/** Outcome of an authorization check: either allowed, or a specific HTTP failure. */
type AuthResult = { allowed: true } | { allowed: false; status: number; message: string };

/**
 * Authorize a PROPERTY_MANAGER / ADMIN to pay out a work order.
 *
 * Ownership chain: WorkOrder -> MaintenanceRequest -> Rental -> (managerId |
 * ownerId). ADMIN bypasses the rental check; a manager must manage or own the
 * rental. An unresolvable chain (missing work order / request / rental) yields
 * 404, while a resolvable but unowned rental yields 403.
 *
 * NOTE: deliberately a module-level function, not a class method — Express
 * invokes route handlers unbound (`router.post(path, ..., controller.method)`),
 * so `this` is `undefined` inside them and a method reference would throw.
 */
async function authorizeWorkOrder(user: User, workOrderId: string): Promise<AuthResult> {
  if (user.role === 'ADMIN') {
    return { allowed: true };
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      MaintenanceRequest: {
        include: { Rental: true },
      },
    },
  });

  if (!workOrder || !workOrder.MaintenanceRequest || !workOrder.MaintenanceRequest.Rental) {
    return { allowed: false, status: 404, message: 'Work order not found.' };
  }

  const rental = workOrder.MaintenanceRequest.Rental;

  if (rental.managerId === user.id || rental.ownerId === user.id) {
    return { allowed: true };
  }

  return {
    allowed: false,
    status: 403,
    message: 'You are not authorized to pay out this work order.',
  };
}

class VendorPaymentController {
  /**
   * POST /api/vendor-payments/payout
   *
   * AUTHZ (P0): the route already authenticates the caller and role-checks it
   * (`PROPERTY_MANAGER` | `ADMIN`). Role alone is NOT sufficient: signup is
   * public, so any self-registered PROPERTY_MANAGER could otherwise pass an
   * arbitrary `workOrderId` and move real money to that work order's vendor. We
   * therefore bind the payout to the rental that owns the work order.
   */
  async initiatePayment(req: Request, res: Response) {
    const { workOrderId } = req.body;

    if (!workOrderId) {
      return res.status(400).json({ error: 'Work order ID is required.' });
    }

    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    try {
      const authz = await authorizeWorkOrder(user, workOrderId);
      if (!authz.allowed) {
        return res.status(authz.status).json({ error: authz.message });
      }

      const payment = await vendorPaymentService.initiatePayment(workOrderId);
      return res.status(200).json(payment);
    } catch (error) {
      logger.error(`Error initiating payment: ${error}`);
      return res.status(500).json({ error: 'Failed to initiate payment.' });
    }
  }

  /**
   * GET /api/vendor-payments/history/:vendorId
   *
   * AUTHZ (P0, same class as the payout): `:vendorId` is caller-supplied, so
   * without an ownership check any authenticated VENDOR / PROPERTY_MANAGER could
   * read any vendor's payment history (amounts, dates, transaction ids).
   *   - ADMIN            -> full history
   *   - VENDOR           -> only their own vendor record
   *   - PROPERTY_MANAGER -> only payments on rentals they manage / own
   */
  async getPaymentHistory(req: Request, res: Response) {
    const { vendorId } = req.params;

    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    try {
      if (user.role === 'ADMIN') {
        const history = await vendorPaymentService.getPaymentHistory(vendorId);
        return res.status(200).json(history);
      }

      if (user.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
          where: { id: vendorId },
          select: { contactPersonId: true },
        });

        if (!vendor) {
          return res.status(404).json({ error: 'Vendor not found.' });
        }

        if (vendor.contactPersonId !== user.id) {
          return res
            .status(403)
            .json({ error: 'You are not authorized to view this vendor\'s payment history.' });
        }

        const history = await vendorPaymentService.getPaymentHistory(vendorId);
        return res.status(200).json(history);
      }

      // PROPERTY_MANAGER (and any other non-admin role): scope the query to
      // rentals the caller manages or owns. An unrelated manager receives an
      // empty list rather than another manager's data.
      const history = await vendorPaymentService.getPaymentHistory(vendorId, user.id);
      return res.status(200).json(history);
    } catch (error) {
      logger.error(`Error getting payment history: ${error}`);
      return res.status(500).json({ error: 'Failed to get payment history.' });
    }
  }

  /**
   * POST /api/vendor-payments/stripe-webhooks
   *
   * AUTHN (P0): this endpoint is on the anonymous allowlist because Stripe
   * cannot present a user JWT. Authenticity therefore comes from the provider
   * SIGNATURE over the RAW request bytes — we never trust `req.body`, which is a
   * re-serialized object Stripe did not sign. Fails closed with HTTP 400 when
   * the signature or raw body is missing, or the signature does not verify.
   */
  async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string | undefined;

    if (!req.rawBody || !signature) {
      return res.status(400).json({ error: 'Missing Stripe signature or raw request body.' });
    }

    let event: Stripe.Event;
    try {
      event = vendorPaymentService.verifyWebhookSignature(req.rawBody, signature);
    } catch (error) {
      logger.warn(`Rejected Stripe webhook with invalid signature: ${(error as Error).message}`);
      return res.status(400).json({ error: 'Invalid Stripe signature.' });
    }

    try {
      await vendorPaymentService.handleStripeWebhook(event);
      return res.status(200).json({ received: true });
    } catch (error) {
      logger.error(`Error handling Stripe webhook: ${error}`);
      return res.status(500).json({ error: 'Failed to handle Stripe webhook.' });
    }
  }
}

export const vendorPaymentController = new VendorPaymentController();
