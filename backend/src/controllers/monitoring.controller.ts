import { Request, Response } from 'express';
import { registerMetrics, getContentType } from '../services/monitoring.service';

export const getMetrics = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', getContentType());
    res.end(await registerMetrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
};
