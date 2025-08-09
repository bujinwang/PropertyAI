import { Request, Response } from 'express';
import { managerService } from '../services/manager.service';

class ManagerController {
  public async getQuotesForWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      console.log('Getting quotes for work order:', req.params.id);
      const { id } = req.params;
      const quotes = await managerService.getQuotesForWorkOrder(id);
      console.log('Found quotes:', quotes);
      res.status(200).json(quotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: 'Failed to fetch quotes', details: errorMessage });
    }
  }

  public async approveQuote(req: Request, res: Response): Promise<void> {
    try {
      console.log('Approving quote:', req.params.id);
      const { id } = req.params;
      await managerService.approveQuote(id);
      res.status(200).json({ message: 'Quote approved successfully.' });
    } catch (error) {
      console.error('Error approving quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: 'Failed to approve quote', details: errorMessage });
    }
  }

  public async rejectQuote(req: Request, res: Response): Promise<void> {
    try {
      console.log('Rejecting quote:', req.params.id);
      const { id } = req.params;
      await managerService.rejectQuote(id);
      res.status(200).json({ message: 'Quote rejected successfully.' });
    } catch (error) {
      console.error('Error rejecting quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: 'Failed to reject quote', details: errorMessage });
    }
  }
}

export const managerController = new ManagerController();