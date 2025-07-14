import { Request, Response } from 'express';
import { identifySlowQueries, analyzeQuery } from '../services/databaseOptimization.service';

export const getSlowQueries = async (req: Request, res: Response) => {
  const { threshold } = req.query;
  if (!threshold) {
    return res.status(400).json({ error: 'Threshold is required' });
  }

  try {
    const slowQueries = await identifySlowQueries(Number(threshold));
    res.status(200).json(slowQueries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to identify slow queries' });
  }
};

export const analyzeQueryPerformance = async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const analysis = await analyzeQuery(query);
    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze query' });
  }
};
