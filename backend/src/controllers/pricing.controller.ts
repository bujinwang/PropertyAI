import { Request, Response } from 'express';
import { pricingService } from '../services/pricing.service';

class PricingController {
  async getPriceRecommendation(req: Request, res: Response) {
    try {
      const propertyData = req.body;
      const recommendation = await pricingService.getPriceRecommendation(propertyData);
      res.status(200).json(recommendation);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  }
}

export const pricingController = new PricingController();
