import { Request, Response } from 'express';
import { roiService } from '../services/roi.service';
import logger from '../utils/logger';

export const getRoi = async (req: Request, res: Response) => {
  const { propertyId } = req.params;

  if (!propertyId) {
    return res.status(400).json({ error: 'Property ID is required' });
  }

  try {
    const roi = await roiService.calculateRoi(propertyId);
    res.status(200).json(roi);
  } catch (error) {
    logger.error(`Error calculating ROI: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
