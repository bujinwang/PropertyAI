import { Request, Response } from 'express';
import { knowledgeBaseService } from '../services/knowledgeBase.service';
import logger from '../utils/logger';

export const getSolution = async (req: Request, res: Response) => {
  const { issue } = req.query;

  if (!issue) {
    return res.status(400).json({ error: 'Issue is required' });
  }

  try {
    const solution = await knowledgeBaseService.getSolutionForIssue(issue as string);
    res.status(200).json({ solution });
  } catch (error) {
    logger.error(`Error getting solution: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addKnowledgeBaseEntry = async (req: Request, res: Response) => {
  const { buildingId, issue, solution } = req.body;

  if (!buildingId || !issue || !solution) {
    return res.status(400).json({ error: 'Building ID, issue, and solution are required' });
  }

  try {
    await knowledgeBaseService.addKnowledgeBaseEntry(buildingId, issue, solution);
    res.status(201).json({ message: 'Knowledge base entry added successfully' });
  } catch (error) {
    logger.error(`Error adding knowledge base entry: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
