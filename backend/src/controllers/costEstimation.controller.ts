import { Request, Response } from 'express';
import { costEstimationService } from '../services/costEstimation.service';

class CostEstimationController {
  public async getCostEstimation(req: Request, res: Response): Promise<void> {
    try {
      const { workOrderId } = req.params;
      const estimation = await costEstimationService.estimateCost(workOrderId);
      if (estimation) {
        res.status(200).json(estimation);
      } else {
        res.status(404).json({ message: 'No estimation available for this work order.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error getting cost estimation.', error });
    }
  }
}

export const costEstimationController = new CostEstimationController();
