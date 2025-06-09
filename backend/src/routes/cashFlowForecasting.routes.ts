import { Router } from 'express';
import * as cashFlowForecastingController from '../controllers/cashFlowForecasting.controller';

const router = Router();

router.get('/:months', cashFlowForecastingController.forecastCashFlow);

export default router;
