import { Request, Response } from 'express';
import { getPricingRecommendation } from '../services/pricing.service';

export const recommendPrice = async (req: Request, res: Response) => {
  try {
    const { propertyFeatures } = req.body;
    const recommendation = await getPricingRecommendation(propertyFeatures);
    res.status(200).json(recommendation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};