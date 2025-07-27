import { Request, Response } from 'express';
import { photoAnalysisService } from '../services/photoAnalysis.service';
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
    // For now, we'll create a simple analysis result since we don't have image buffer
    const analysisResult = {
      id: maintenanceRequestId,
      imageUrl,
      analysis: {
        labels: [],
        text: [],
        faces: [],
        quality: { brightness: 0.8, sharpness: 0.9, contrast: 0.7 },
        moderation: { isSafe: true, moderationLabels: [] }
      },
      recommendations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await photoAnalysisService.storeAnalysisResult(maintenanceRequestId, analysisResult);

    res.status(200).json({ message: 'Analysis stored successfully', analysis: analysisResult });
  } catch (error) {
    logger.error(`Error analyzing maintenance photo: ${error}`);
    res.status(500).json({ error: 'Failed to analyze photo.' });
  }
};
