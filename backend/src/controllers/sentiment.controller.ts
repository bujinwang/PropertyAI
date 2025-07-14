import { Request, Response } from 'express';
import { sentimentService } from '../services/sentiment.service';

export const analyzeSentiment = async (req: Request, res: Response) => {
  try {
    const { messageId, text } = req.body;
    await sentimentService.analyzeAndSaveSentiment(messageId, text);
    res.status(200).json({ message: 'Sentiment analyzed and saved successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
