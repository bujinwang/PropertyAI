import { Request, Response } from 'express';
import { emergencyRoutingService } from '../services/emergencyRouting.service';

class EmergencyRoutingController {
  public async routeEmergencyRequest(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceRequestId } = req.params;
      const vendorId = await emergencyRoutingService.routeEmergencyRequest(
        maintenanceRequestId
      );
      if (vendorId) {
        res.status(200).json({ vendorId });
      } else {
        res.status(404).json({ message: 'No suitable vendor found for this emergency.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error routing emergency request.', error });
    }
  }
}

export const emergencyRoutingController = new EmergencyRoutingController();
