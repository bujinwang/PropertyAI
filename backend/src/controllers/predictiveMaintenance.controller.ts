import { Request, Response } from 'express';
import { predictiveMaintenanceService } from '../services/predictiveMaintenance.service';

class PredictiveMaintenanceController {
  public async predictFailure(req: Request, res: Response): Promise<void> {
    const { applianceId } = req.params;
    try {
      const prediction = await predictiveMaintenanceService.predictFailure(applianceId);
      res.status(200).json(prediction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const predictiveMaintenanceController = new PredictiveMaintenanceController();
