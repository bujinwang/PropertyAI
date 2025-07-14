import { Request, Response } from 'express';
import { maintenanceRequestCategorizationService } from '../services/maintenanceRequestCategorization.service';

class MaintenanceRequestCategorizationController {
  public async categorizeRequest(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceRequestId } = req.params;
      const category =
        await maintenanceRequestCategorizationService.categorizeRequest(
          maintenanceRequestId
        );
      if (category) {
        res.status(200).json(category);
      } else {
        res.status(404).json({ message: 'Could not categorize request.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error categorizing request.', error });
    }
  }
}

export const maintenanceRequestCategorizationController =
  new MaintenanceRequestCategorizationController();
