import { Request, Response } from 'express';
import { complianceService } from '../services/compliance.service';

class ComplianceController {
  async getDataAccessRequest(req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      const data = await complianceService.getDataAccessRequest(userId);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data access request.' });
    }
  }

  async getDataPortabilityRequest(req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      const data = await complianceService.getDataPortabilityRequest(userId);
      res.header('Content-Type', 'application/json');
      res.send(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data portability request.' });
    }
  }

  async getDataErasureRequest(req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      await complianceService.getDataErasureRequest(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data erasure request.' });
    }
  }
}

export const complianceController = new ComplianceController();