import { Request, Response } from 'express';
import { translationService } from '../services/translation.service';

export const translateText = async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;
    const translatedText = await translationService.translate(text, targetLanguage);
    res.status(200).json({ translatedText });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
