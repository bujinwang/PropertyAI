import { Request, Response } from 'express';
import { TenantRatingService } from '../services/tenantRating.service';

export class TenantRatingController {
  private tenantRatingService = new TenantRatingService();

  createTenantRating = async (req: Request, res: Response) => {
    try {
      const rating = await this.tenantRatingService.createTenantRating(req.body);
      res.status(201).json(rating);
    } catch (error) {
      res.status(500).json({ message: 'Error creating tenant rating', error });
    }
  };

  getTenantRatings = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const ratings = await this.tenantRatingService.getTenantRatings(tenantId);
      res.status(200).json(ratings);
    } catch (error) {
      res.status(500).json({ message: 'Error getting tenant ratings', error });
    }
  };
}
