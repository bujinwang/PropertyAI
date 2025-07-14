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
        unit: {
          include: {
            maintenanceRequests: {
              include: {
                workOrder: true,
              },
            },
          },
        },
      },
    });
  }

  private extractFeatures(appliance: any): any {
    const features: any = {};
    
    features.age = (new Date().getTime() - new Date(appliance.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    features.maintenance_count = appliance.unit.maintenanceRequests.length;
    features.time_since_last_maintenance = appliance.lastMaintenanceDate 
      ? (new Date().getTime() - new Date(appliance.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    const typeFeatures: any = {
      'REFRIGERATOR': { 'type_REFRIGERATOR': 1, 'type_OVEN': 0, 'type_DISHWASHER': 0 },
      'OVEN': { 'type_REFRIGERATOR': 0, 'type_OVEN': 1, 'type_DISHWASHER': 0 },
      'DISHWASHER': { 'type_REFRIGERATOR': 0, 'type_OVEN': 0, 'type_DISHWASHER': 1 },
    };

    const applianceType = appliance.type.toUpperCase();
    if (typeFeatures[applianceType]) {
      Object.assign(features, typeFeatures[applianceType]);
    }

    return features;
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceService();
