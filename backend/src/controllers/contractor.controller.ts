import { Request, Response } from 'express';
import { contractorService } from '../services/contractor.service';
import { WorkOrderStatus } from '@prisma/client';

class ContractorController {
  public async getWorkOrders(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = (req.user as any).vendor.id;
      const workOrders = await contractorService.getWorkOrders(vendorId);
      res.status(200).json(workOrders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch work orders' });
    }
  }

  public async getWorkOrderDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workOrder = await contractorService.getWorkOrderDetails(id);
      if (!workOrder) {
        res.status(404).json({ error: 'Work order not found' });
        return;
      }
      res.status(200).json(workOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch work order details' });
    }
  }

  public async acceptWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const workOrder = await contractorService.acceptWorkOrder(id);
      res.status(200).json(workOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to accept work order' });
    }
  }

  public async updateWorkOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: WorkOrderStatus };
      const workOrder = await contractorService.updateWorkOrderStatus(id, status);
      res.status(200).json(workOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update work order status' });
    }
  }

  public async submitInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { invoiceUrl } = req.body;
      const userId = (req.user as any).id;
      const document = await contractorService.submitInvoice(id, invoiceUrl, userId);
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit invoice' });
    }
  }

  public async declineWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendorId = (req.user as any).vendor.id;
      await contractorService.declineWorkOrder(id, vendorId);
      res.status(200).json({ message: 'Work order declined successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to decline work order' });
    }
  }

  public async submitQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, details } = req.body;
      const vendorId = (req.user as any).vendor.id;
      const quote = await contractorService.submitQuote(id, vendorId, amount, details);
      res.status(201).json(quote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit quote' });
    }
  }

  public async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const messages = await contractorService.getMessages(id);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  public async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const senderId = (req.user as any).id;
      const message = await contractorService.sendMessage(id, senderId, content);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
}

export const contractorController = new ContractorController();