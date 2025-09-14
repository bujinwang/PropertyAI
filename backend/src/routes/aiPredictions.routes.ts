import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import { authenticateToken } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../config/database';

const router = Router();

// Helper function to run Python scripts
const runPythonScript = (scriptPath: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, ...args]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(result);
      } else {
        reject(new Error(`Python script failed: ${error}`));
      }
    });
  });
};

// Predictive Maintenance Prediction
router.post('/maintenance/:applianceId', authenticateToken, [
  param('applianceId').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { applianceId } = req.params;

    // Get appliance data from database
    const appliance = await prisma.appliance.findUnique({
      where: { id: applianceId },
      include: {
        Unit: {
          include: {
            MaintenanceRequests: {
              include: {
                WorkOrder: true,
              },
            },
          },
        },
      },
    });

    if (!appliance) {
      return res.status(404).json({ error: 'Appliance not found' });
    }

    // Extract features
    const features = {
      purchaseDate: appliance.purchaseDate,
      lastMaintenanceDate: appliance.lastMaintenanceDate,
      type: appliance.type,
      brand: appliance.brand || 'Unknown',
      model: appliance.model || 'Unknown',
      maintenance_count: appliance.Unit?.MaintenanceRequests?.length || 0,
      high_priority_maintenance_count: appliance.Unit?.MaintenanceRequests?.filter(mr =>
        mr.priority === 'HIGH' || mr.priority === 'CRITICAL'
      ).length || 0,
      avg_maintenance_cost: appliance.Unit?.MaintenanceRequests?.reduce((sum, mr) =>
        sum + (mr.estimatedCost || 0), 0
      ) / (appliance.Unit?.MaintenanceRequests?.length || 1) || 0,
    };

    // Run Python prediction
    const scriptPath = path.join(__dirname, '../predictive-maintenance/predict.py');
    const result = await runPythonScript(scriptPath, [JSON.stringify(features)]);
    const prediction = JSON.parse(result);

    // Log the prediction
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: 'predictive_maintenance',
        prompt: `Appliance ${applianceId} maintenance prediction`,
        response: JSON.stringify(prediction),
      },
    });

    res.json({
      success: true,
      data: {
        applianceId,
        ...prediction,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in maintenance prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict maintenance',
    });
  }
});

// Financial Forecasting
router.post('/financial/:propertyId', authenticateToken, [
  param('propertyId').isString().notEmpty(),
  body('forecast_period').optional().isString(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { forecast_period = 'next_month' } = req.body;

    // Get recent financial data
    const transactions = await prisma.transaction.findMany({
      where: {
        propertyId,
        createdAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'No transaction data found for this property' });
    }

    // Prepare features for forecasting
    const features = {
      transaction_count: transactions.length,
      avg_income: transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0) / transactions.filter(t => t.type === 'INCOME').length || 0,
      avg_expense: transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0) / transactions.filter(t => t.type === 'EXPENSE').length || 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      quarter: Math.floor((new Date().getMonth() + 3) / 3),
    };

    // Run Python forecasting
    const scriptPath = path.join(__dirname, '../predictive-analytics/financial_forecast.py');
    const result = await runPythonScript(scriptPath, ['forecast', JSON.stringify(features)]);
    const forecast = JSON.parse(result);

    // Log the forecast
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: 'financial_forecasting',
        prompt: `Property ${propertyId} financial forecast`,
        response: JSON.stringify(forecast),
      },
    });

    res.json({
      success: true,
      data: {
        propertyId,
        ...forecast,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in financial forecasting:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate financial forecast',
    });
  }
});

// Tenant Behavior Prediction
router.post('/tenant-behavior/:tenantId', authenticateToken, [
  param('tenantId').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    // Get tenant data
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        Unit: true,
        Payments: true,
        MaintenanceRequests: true,
        Messages: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Extract features
    const features = {
      tenure_days: tenant.moveInDate ? Math.floor((Date.now() - new Date(tenant.moveInDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      total_payments: tenant.Payments?.length || 0,
      late_payments: tenant.Payments?.filter(p => p.status === 'LATE').length || 0,
      missed_payments: tenant.Payments?.filter(p => p.status === 'MISSED').length || 0,
      maintenance_requests: tenant.MaintenanceRequests?.length || 0,
      urgent_maintenance: tenant.MaintenanceRequests?.filter(mr => mr.priority === 'HIGH' || mr.priority === 'CRITICAL').length || 0,
      total_messages: tenant.Messages?.length || 0,
      complaint_messages: tenant.Messages?.filter(m => m.type === 'COMPLAINT').length || 0,
      rent_amount: tenant.Unit?.rent_amount || 0,
      credit_score: tenant.credit_score || 600,
      employment_status: tenant.employment_status || 'Unknown',
      income_range: tenant.income_range || 'Unknown',
    };

    // Run Python prediction
    const scriptPath = path.join(__dirname, '../predictive-analytics/tenant_behavior.py');
    const result = await runPythonScript(scriptPath, ['predict', JSON.stringify(features)]);
    const prediction = JSON.parse(result);

    // Log the prediction
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: 'tenant_behavior_prediction',
        prompt: `Tenant ${tenantId} behavior prediction`,
        response: JSON.stringify(prediction),
      },
    });

    res.json({
      success: true,
      data: {
        tenantId,
        ...prediction,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in tenant behavior prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict tenant behavior',
    });
  }
});

// Anomaly Detection
router.post('/anomaly-detection/:propertyId', authenticateToken, [
  param('propertyId').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    // Get recent transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        propertyId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'No recent transactions found' });
    }

    // Prepare features for anomaly detection
    const features_list = transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type_encoded: t.type === 'INCOME' ? 1 : t.type === 'EXPENSE' ? -1 : 0,
      category_encoded: 0, // Would need proper encoding
      day_of_week: new Date(t.createdAt).getDay(),
      hour_of_day: new Date(t.createdAt).getHours(),
      is_weekend: [0, 6].includes(new Date(t.createdAt).getDay()) ? 1 : 0,
      is_business_hours: (new Date(t.createdAt).getHours() >= 9 && new Date(t.createdAt).getHours() <= 17) ? 1 : 0,
    }));

    // Run Python anomaly detection
    const scriptPath = path.join(__dirname, '../predictive-analytics/anomaly_detection.py');
    const result = await runPythonScript(scriptPath, ['detect', JSON.stringify(features_list)]);
    const anomalies = JSON.parse(result);

    // Log the analysis
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: 'anomaly_detection',
        prompt: `Property ${propertyId} anomaly detection`,
        response: JSON.stringify(anomalies),
      },
    });

    res.json({
      success: true,
      data: {
        propertyId,
        anomalies,
        total_transactions: transactions.length,
        anomaly_count: anomalies.filter((a: any) => a.is_anomaly).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in anomaly detection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to detect anomalies',
    });
  }
});

// Property Inspection (Computer Vision)
router.post('/property-inspection', authenticateToken, [
  body('imagePath').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { imagePath } = req.body;

    // Verify image exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Run Python image analysis
    const scriptPath = path.join(__dirname, '../cv/property_inspection.py');
    const result = await runPythonScript(scriptPath, ['analyze', imagePath]);
    const analysis = JSON.parse(result);

    // Log the analysis
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: 'property_inspection',
        prompt: `Property inspection analysis for ${imagePath}`,
        response: JSON.stringify(analysis),
      },
    });

    res.json({
      success: true,
      data: {
        ...analysis,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in property inspection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze property image',
    });
  }
});

// Batch Predictions
router.post('/batch/:modelType', authenticateToken, [
  body('items').isArray().notEmpty(),
  param('modelType').isIn(['maintenance', 'financial', 'tenant', 'anomaly']),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { modelType } = req.params;
    const { items } = req.body;

    const results = [];

    for (const item of items) {
      try {
        let result;
        switch (modelType) {
          case 'maintenance': {
            const scriptPath = path.join(__dirname, '../predictive-maintenance/predict.py');
            const maintResult = await runPythonScript(scriptPath, [JSON.stringify(item)]);
            result = JSON.parse(maintResult);
            break;
          }
          // Add other model types as needed
          default:
            result = { error: 'Model type not supported' };
        }
        results.push({ item, result });
      } catch (itemError: any) {
        results.push({ item, error: itemError.message });
      }
    }

    // Log batch operation
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: `batch_${modelType}_prediction`,
        prompt: `Batch prediction for ${items.length} items`,
        response: JSON.stringify(results),
      },
    });

    res.json({
      success: true,
      data: {
        modelType,
        results,
        total_items: items.length,
        successful_predictions: results.filter(r => !r.error).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in batch prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process batch prediction',
    });
  }
});

export default router;