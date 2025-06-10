import { Request, Response } from 'express';
import { analyzeImage, storeAnalysisResult } from '../services/photoAnalysis.service';
import logger from '../utils/logger';

/**
 * Handles the analysis of an uploaded image for a maintenance request.
 * @param req The request object.
 * @param res The response object.
 */
export const analyzeMaintenancePhoto = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceRequestId } = req.params;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    res.status(400).json({ error: 'Image URL is required.' });
    return;
  }

  try {
    const analysisResult = await analyzeImage(imageUrl);
    await storeAnalysisResult(maintenanceRequestId, analysisResult);

    res.status(200).json(analysisResult);
  } catch (error) {
    logger.error('Error analyzing maintenance photo:', error);
    res.status(500).json({ error: 'Failed to analyze photo.' });
  }
};
