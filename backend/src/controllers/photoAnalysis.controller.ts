import { Request, Response } from 'express';
import { photoAnalysisService } from '../services/photoAnalysis.service';

class PhotoAnalysisController {
  public async analyzeMaintenancePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceRequestId, photoUrl } = req.body;
      const photoAnalysis = await photoAnalysisService.analyzeMaintenancePhoto(
        maintenanceRequestId,
        photoUrl
      );
      res.status(201).json(photoAnalysis);
    } catch (error) {
      res.status(500).json({ message: 'Error analyzing maintenance photo.', error });
    }
  }
}

export const photoAnalysisController = new PhotoAnalysisController();
