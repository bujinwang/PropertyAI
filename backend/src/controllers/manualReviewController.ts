import { Request, Response } from 'express';
import ManualReviewService from '../services/manualReviewService';

class ManualReviewController {
  async getApplicationsForReview(req: Request, res: Response) {
    try {
      const applications = await ManualReviewService.getApplicationsForReview();
      res.status(200).json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async approveApplication(req: Request, res: Response) {
    try {
      const application = await ManualReviewService.approveApplication(
        req.params.id
      );
      res.status(200).json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async rejectApplication(req: Request, res: Response) {
    try {
      const application = await ManualReviewService.rejectApplication(
        req.params.id
      );
      res.status(200).json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ManualReviewController();
