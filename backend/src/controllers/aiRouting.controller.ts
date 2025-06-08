import { Request, Response } from 'express';
import { aiRoutingService } from '../services/aiRouting.service';

class AIRoutingController {
  public async findBestVendor(req: Request, res: Response): Promise<void> {
    try {
      const { workOrderId } = req.params;
      const vendorId = await aiRoutingService.findBestVendor(workOrderId);
      if (vendorId) {
        res.status(200).json({ vendorId });
      } else {
        res.status(404).json({ message: 'No suitable vendor found.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error finding best vendor.', error });
    }
  }
}

export const aiRoutingController = new AIRoutingController();
