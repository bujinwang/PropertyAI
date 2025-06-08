import { Request, Response, NextFunction } from 'express';
import publishingService from '../services/publishingService';

export const publishingController = {
  async publishListing(req: Request, res: Response, next: NextFunction) {
    try {
      const { listingId, platform } = req.body;
      if (!listingId || !platform) {
        return res.status(400).json({ message: 'Missing listingId or platform' });
      }
      const result = await publishingService.publishListing(listingId, platform);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default publishingController;