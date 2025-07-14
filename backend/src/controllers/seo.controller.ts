import { Request, Response } from 'express';
import { seoService } from '../services/seo.service';

class SeoController {
  async optimizeListing(req: Request, res: Response) {
    try {
      const { propertyData } = req.body;
      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }
      const imageData = req.file.buffer;
      const seoData = await seoService.optimizeListing(propertyData, imageData);
      res.status(200).json(seoData);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  }
}

export const seoController = new SeoController();
