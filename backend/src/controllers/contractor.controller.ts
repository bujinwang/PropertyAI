import { Request, Response } from 'express';
import { contractorService } from '../services/contractor.service';
import { WorkOrderStatus } from '@prisma/client';

/**
 * Contractor (vendor-facing) endpoints.
 *
 * VENDOR RESOLUTION
 * -----------------
 * `Vendor` has no `userId`; it links back through `Vendor.contactPersonId` and
 * appears on the user as `User.Vendor` (capital V). This controller originally
 * read `(req.user as any).vendor.id` — lowercase, on a user hydrated by
 * `authMiddleware.protect` with no `include`. That was always `undefined`, so
 * EVERY endpoint here threw and returned 500. Resolve the vendor explicitly via
 * `contractorService.getVendorIdForUser` instead of assuming middleware shape.
 *
 * ERROR MAPPING
 * -------------
 * Every handler used to collapse any thrown error into 500. A vendor asking for
 * a work order they are not assigned to must get 403, and a missing id must get
 * 404 — otherwise a real authorization refusal is indistinguishable from a
 * crash. Service methods raise `{ status }` for exactly that reason.
 */

/** Map a service error to its intended status, defaulting to 500. */
function handleError(res: Response, error: any, fallback: string): void {
  const status = Number(error?.status) || 500;
  if (status >= 500) console.error(fallback, error);
  res.status(status).json({ error: error?.message || fallback });
}

/**
 * The authenticated user's vendor id, or null when they have no vendor row.
 *
 * Deliberately a MODULE-LEVEL function, not a class method. These handlers are
 * passed to Express UNBOUND (`router.get(path, contractorController.getWorkOrders)`),
 * so `this` is `undefined` inside them and any `this.x()` throws a TypeError
 * that surfaces as a 500 — while still typechecking cleanly. Never introduce
 * `this.` in this file.
 */
async function resolveVendorId(req: Request): Promise<string | null> {
  const userId = (req.user as any)?.id;
  if (!userId) return null;
  return contractorService.getVendorIdForUser(userId);
}

class ContractorController {
  public async getWorkOrders(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const workOrders = await contractorService.getWorkOrders(vendorId);
      res.status(200).json(workOrders);
    } catch (error) {
      handleError(res, error, 'Failed to fetch work orders');
    }
  }

  public async getWorkOrderDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const workOrder = await contractorService.getWorkOrderDetails(id, vendorId);
      if (!workOrder) {
        res.status(404).json({ error: 'Work order not found' });
        return;
      }
      res.status(200).json(workOrder);
    } catch (error) {
      handleError(res, error, 'Failed to fetch work order details');
    }
  }

  public async acceptWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const workOrder = await contractorService.acceptWorkOrder(id, vendorId);
      res.status(200).json(workOrder);
    } catch (error) {
      handleError(res, error, 'Failed to accept work order');
    }
  }

  public async updateWorkOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: WorkOrderStatus };
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const workOrder = await contractorService.updateWorkOrderStatus(id, vendorId, status);
      res.status(200).json(workOrder);
    } catch (error) {
      handleError(res, error, 'Failed to update work order status');
    }
  }

  public async submitInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { invoiceUrl } = req.body;
      const userId = (req.user as any).id;
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const document = await contractorService.submitInvoice(id, invoiceUrl, userId, vendorId);
      res.status(201).json(document);
    } catch (error) {
      handleError(res, error, 'Failed to submit invoice');
    }
  }

  public async declineWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      await contractorService.declineWorkOrder(id, vendorId);
      res.status(200).json({ message: 'Work order declined successfully.' });
    } catch (error) {
      handleError(res, error, 'Failed to decline work order');
    }
  }

  public async submitQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, details } = req.body;
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const quote = await contractorService.submitQuote(id, vendorId, amount, details);
      res.status(201).json(quote);
    } catch (error) {
      handleError(res, error, 'Failed to submit quote');
    }
  }

  public async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const messages = await contractorService.getMessages(id, vendorId);
      res.status(200).json(messages);
    } catch (error) {
      handleError(res, error, 'Failed to fetch messages');
    }
  }

  public async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const senderId = (req.user as any).id;
      const vendorId = await resolveVendorId(req);
      if (!vendorId) {
        res.status(403).json({ error: 'No vendor profile is linked to this account' });
        return;
      }
      const message = await contractorService.sendMessage(id, senderId, content, vendorId);
      res.status(201).json(message);
    } catch (error) {
      handleError(res, error, 'Failed to send message');
    }
  }
}

export const contractorController = new ContractorController();
