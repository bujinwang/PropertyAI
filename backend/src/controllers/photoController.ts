import { Request, Response, NextFunction } from 'express';
import * as photoService from '../services/photoService';
import { AppError } from '../middleware/errorMiddleware';

export const optimize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No photo uploaded', 400));
    }

    const { width, height, quality, format } = req.body;
    const options = {
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
      quality: quality ? parseInt(quality, 10) : undefined,
      format,
    };

    const optimizedBuffer = await photoService.optimizePhoto(req.file.buffer, options);

    res.set('Content-Type', `image/${format || 'jpeg'}`);
    res.send(optimizedBuffer);
  } catch (error) {
    next(error);
  }
};
