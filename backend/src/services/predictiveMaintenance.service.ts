import { prisma } from '../config/database';
import { Appliance } from '@prisma/client';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

class PredictiveMaintenanceService {
  private modelPath = path.join(__dirname, '../predictive-maintenance/predictive_maintenance_model.pkl');

  public async predictFailure(applianceId: string): Promise<any> {
    if (!fs.existsSync(this.modelPath)) {
      throw new Error('Model not found. Please train the model first.');
    }

    const appliance = await this.getApplianceData(applianceId);
    if (!appliance) {
      throw new Error('Appliance not found');
    }

    const features = this.extractFeatures(appliance);
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        path.join(__dirname, '../predictive-maintenance/predict.py'),
        JSON.stringify(features),
      ]);

      let prediction = '';
      pythonProcess.stdout.on('data', (data) => {
        prediction += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(prediction));
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });
    });
  }

  private async getApplianceData(applianceId: string): Promise<any> {
    return prisma.appliance.findUnique({
      where: { id: applianceId },
      include: {
        Rental: {
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
  }

  private extractFeatures(appliance: any): any {
    const features: any = {};

    // Basic features
    const purchaseDate = appliance.purchaseDate ? new Date(appliance.purchaseDate) : new Date();
    const currentDate = new Date();

    features.purchaseDate = appliance.purchaseDate;
    features.lastMaintenanceDate = appliance.lastMaintenanceDate;
    features.last_maintenance_completion = appliance.Rental?.MaintenanceRequests?.[0]?.completionDate;
    features.warrantyEndDate = appliance.warrantyEndDate;
    features.brand = appliance.brand || 'Unknown';
    features.model = appliance.model || 'Unknown';
    features.type = appliance.type;

    // Maintenance-related features
    const maintenanceRequests = appliance.Rental?.MaintenanceRequests || [];
    features.maintenance_count = maintenanceRequests.length;
    features.completed_maintenance_count = maintenanceRequests.filter((mr: any) => mr.status === 'COMPLETED').length;
    features.high_priority_maintenance_count = maintenanceRequests.filter((mr: any) =>
      mr.priority === 'HIGH' || mr.priority === 'CRITICAL'
    ).length;

    // Cost features
    const costs = maintenanceRequests
      .map((mr: any) => mr.estimatedCost)
      .filter((cost: any) => cost && cost > 0);
    features.avg_maintenance_cost = costs.length > 0 ? costs.reduce((a: number, b: number) => a + b, 0) / costs.length : 0;

    return features;
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceService();
