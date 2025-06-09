import { Request, Response } from 'express';
import { photoEnhancementService } from '../services/photoEnhancement.service';

class PhotoEnhancementController {
  async enhancePhoto(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }

      const processedImage = await photoEnhancementService.enhancePhoto(req.file.buffer);

      res.set('Content-Type', 'image/webp');
      res.send(processedImage);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error processing image.');
    }
  }
}

export const photoEnhancementController = new PhotoEnhancementController();
