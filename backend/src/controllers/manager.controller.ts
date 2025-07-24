import { Request, Response } from 'express';
import { managerService } from '../services/manager.service';

class ManagerController {
  public async getQuotesForWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotes = await managerService.getQuotesForWorkOrder(id);
      res.status(200).json(quotes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  }

  public async approveQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await managerService.approveQuote(id);
      res.status(200).json({ message: 'Quote approved successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve quote' });
    }
  }

  public async rejectQuote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await managerService.rejectQuote(id);
      res.status(200).json({ message: 'Quote rejected successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject quote' });
    }
  }
}

export const managerController = new ManagerController();