import { Request, Response } from 'express';
import { propertyDescriptionService } from '../services/propertyDescription.service';

class PropertyDescriptionController {
  async generateDescription(req: Request, res: Response) {
    try {
      const propertyData = req.body;
      const description = await propertyDescriptionService.generateDescription(propertyData);
      res.status(200).json({ description });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  }
}

export const propertyDescriptionController = new PropertyDescriptionController();
