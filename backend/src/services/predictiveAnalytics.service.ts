import { spawn } from 'child_process';
import path from 'path';

class PredictiveAnalyticsService {
  async getPriceRecommendation(propertyData: any): Promise<any> {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../predictive-analytics/src/deployment/deploy_model.py'),
      JSON.stringify(propertyData),
    ]);

    return new Promise((resolve, reject) => {
      pythonProcess.stdout.on('data', (data) => {
        resolve(JSON.parse(data.toString()));
      });

      pythonProcess.stderr.on('data', (data) => {
        reject(data.toString());
      });
    });
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
