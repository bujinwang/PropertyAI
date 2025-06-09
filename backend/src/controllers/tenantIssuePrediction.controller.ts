import { Request, Response } from 'express';
import * as tenantIssuePredictionService from '../services/tenantIssuePrediction.service';
import logger from '../utils/logger';

/**
 * Handles the request to get all tenant issue predictions.
 * @param req The request object.
 * @param res The response object.
 */
export const getTenantIssuePredictions = async (req: Request, res: Response) => {
  try {
    const predictions = await tenantIssuePredictionService.getTenantIssuePredictions();
    res.status(200).json(predictions);
  } catch (error) {
    logger.error(`Error getting tenant issue predictions: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the request to get a tenant issue prediction by its ID.
 * @param req The request object.
 * @param res The response object.
 */
export const getTenantIssuePredictionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const prediction = await tenantIssuePredictionService.getTenantIssuePredictionById(id);
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }
    res.status(200).json(prediction);
  } catch (error) {
    logger.error(`Error getting tenant issue prediction by ID: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the request to predict tenant issues.
 * @param req The request object.
 * @param res The response object.
 */
export const predictTenantIssues = async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    const prediction = await tenantIssuePredictionService.predictTenantIssues(tenantId);
    res.status(200).json(prediction);
  } catch (error) {
    logger.error(`Error predicting tenant issues: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
