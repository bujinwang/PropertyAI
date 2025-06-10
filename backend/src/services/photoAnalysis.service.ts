import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Analyzes an image to identify maintenance issues.
 * @param imageUrl The URL of the image to analyze.
 * @returns A promise that resolves with the analysis results.
 */
export const analyzeImage = async (imageUrl: string): Promise<any> => {
  try {
    // Placeholder for actual image analysis logic
    logger.info(`Analyzing image at URL: ${imageUrl}`);
    
    // Simulate calling an external CV service
    const analysisResult = {
      issuesDetected: ['Plumbing'],
      severity: 'High',
      recommendations: 'Detected a significant water leak under the sink.',
    };

    return analysisResult;
  } catch (error) {
    logger.error(`Error analyzing image: ${error}`);
    throw new Error('Failed to analyze image.');
  }
};

/**
 * Stores the analysis results in the database.
 * @param maintenanceRequestId The ID of the maintenance request.
 * @param analysisResult The analysis result to store.
 * @returns A promise that resolves when the result is stored.
 */
export const storeAnalysisResult = async (
  maintenanceRequestId: string,
  analysisResult: any
): Promise<void> => {
  try {
    await prisma.photoAnalysis.create({
      data: {
        maintenanceRequest: {
          connect: { id: maintenanceRequestId },
        },
        issuesDetected: analysisResult.issuesDetected,
        severity: analysisResult.severity,
        recommendations: analysisResult.recommendations,
      },
    });
  } catch (error) {
    logger.error(`Error storing analysis result: ${error}`);
    throw new Error('Failed to store analysis result.');
  }
};
