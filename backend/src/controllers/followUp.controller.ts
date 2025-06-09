import { Request, Response } from 'express';
import { followUpService } from '../services/followUp.service';

export const scheduleFollowUp = async (req: Request, res: Response) => {
  try {
    const { messageId, followUpAt } = req.body;
    const followUp = await followUpService.scheduleFollowUp(messageId, followUpAt);
    res.status(201).json(followUp);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowUps = async (req: Request, res: Response) => {
  try {
    const followUps = await followUpService.getFollowUps();
    res.status(200).json(followUps);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
