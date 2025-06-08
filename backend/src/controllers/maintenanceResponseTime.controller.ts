import { Request, Response } from 'express';
import { maintenanceResponseTimeService } from '../services/maintenanceResponseTime.service';

class MaintenanceResponseTimeController {
  public async trackResponseTime(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceRequestId } = req.params;
      const responseTime =
        await maintenanceResponseTimeService.trackResponseTime(
          maintenanceRequestId
        );
      if (responseTime) {
        res.status(201).json(responseTime);
      } else {
        res.status(404).json({ message: 'Could not track response time.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error tracking response time.', error });
    }
  }
}

export const maintenanceResponseTimeController =
  new MaintenanceResponseTimeController();
