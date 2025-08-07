import { Request, Response } from 'express';
import { TenantRatingService } from '../services/tenantRating.service';
import { User } from '@prisma/client';

export class TenantRatingController {
  private tenantRatingService = new TenantRatingService();

  createTenantRating = async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Extract raterId from authenticated user
      const user = req.user as User;
      const ratingData = {
        ...req.body,
        raterId: user.id
      };
      
      const rating = await this.tenantRatingService.createTenantRating(ratingData);
      res.status(201).json(rating);
    } catch (error) {
      console.error('Error creating tenant rating:', error);
      res.status(500).json({ message: 'Error creating tenant rating', error });
    }
  };

  getTenantRatings = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const ratings = await this.tenantRatingService.getTenantRatings(tenantId);
      res.status(200).json(ratings);
    } catch (error) {
      console.error('Error getting tenant ratings:', error);
      res.status(500).json({ message: 'Error getting tenant ratings', error });
    }
  };

  updateTenantRating = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rating = await this.tenantRatingService.updateTenantRating(id, req.body);
      res.status(200).json(rating);
    } catch (error) {
      console.error('Error updating tenant rating:', error);
      res.status(500).json({ message: 'Error updating tenant rating', error });
    }
  };

  deleteTenantRating = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.tenantRatingService.deleteTenantRating(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tenant rating:', error);
      res.status(500).json({ message: 'Error deleting tenant rating', error });
    }
  };

  getTenantRatingAnalytics = async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const analytics = await this.tenantRatingService.getTenantRatingAnalytics(tenantId);
      res.status(200).json({
        analytics,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting tenant rating analytics:', error);
      res.status(500).json({ message: 'Error getting tenant rating analytics', error });
    }
  };
}
