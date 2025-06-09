import { Request, Response } from 'express';
import { publishingService } from '../services/publishing.service';

class PublishingController {
  async publishListing(req: Request, res: Response) {
    try {
      const listingData = req.body;
      const result = await publishingService.publishListing(listingData);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  }
}

export const publishingController = new PublishingController();
