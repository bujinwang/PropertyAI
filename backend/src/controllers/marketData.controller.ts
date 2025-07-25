import { Request, Response } from 'express';
import { marketDataService } from '../services/marketData.service';

class MarketDataController {
  async getComps(req: Request, res: Response) {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      const comps = await marketDataService.getComps(propertyId);
      res.status(200).json(comps);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get market data.' });
    }
  }
}

export const marketDataController = new MarketDataController();