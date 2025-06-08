import { Request, Response, NextFunction } from 'express';
import * as voiceService from '../services/voiceService';
import { AppError } from '../middleware/errorMiddleware';

export const transcribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No audio file uploaded', 400));
    }

    const transcription = await voiceService.convertVoiceToText(req.file.buffer);
    res.json({ transcription });
  } catch (error) {
    next(error);
  }
};
