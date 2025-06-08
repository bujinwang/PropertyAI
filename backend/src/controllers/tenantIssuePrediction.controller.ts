import { Request, Response } from 'express';
import { tenantIssuePredictionService } from '../services/tenantIssuePrediction.service';

class TenantIssuePredictionController {
  public async predictIssues(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const prediction = await tenantIssuePredictionService.predictIssues(tenantId);
      if (prediction) {
        res.status(201).json(prediction);
      } else {
        res.status(404).json({ message: 'Could not predict issues.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error predicting issues.', error });
    }
  }
}

export const tenantIssuePredictionController = new TenantIssuePredictionController();
