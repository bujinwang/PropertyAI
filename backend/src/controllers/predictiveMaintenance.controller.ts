import { Request, Response } from 'express';
import { predictiveMaintenanceService } from '../services/predictiveMaintenance.service';

class PredictiveMaintenanceController {
  public async getPrediction(req: Request, res: Response): Promise<void> {
    try {
      const { unitId } = req.params;
      const prediction = await predictiveMaintenanceService.predictMaintenance(unitId);
      if (prediction) {
        res.status(200).json(prediction);
      } else {
        res.status(404).json({ message: 'No prediction available for this unit.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error getting prediction.', error });
    }
  }
}

export const predictiveMaintenanceController = new PredictiveMaintenanceController();
