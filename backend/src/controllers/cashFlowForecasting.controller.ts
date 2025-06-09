import { Request, Response } from 'express';
import { cashFlowForecastingService } from '../services/cashFlowForecasting.service';
import logger from '../utils/logger';

export const forecastCashFlow = async (req: Request, res: Response) => {
  const { months } = req.params;

  if (!months) {
    return res.status(400).json({ error: 'Number of months is required' });
  }

  try {
    const forecast = await cashFlowForecastingService.forecastCashFlow(parseInt(months));
    res.status(200).json(forecast);
  } catch (error) {
    logger.error(`Error forecasting cash flow: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
