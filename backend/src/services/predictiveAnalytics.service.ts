import { spawn } from 'child_process';
import path from 'path';
import axios from 'axios';

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

  /**
   * Calls the deployed predictive analytics REST API to predict tenant screening issues.
   * @param applicationData - The applicant or application data to send for prediction.
   * @returns The prediction result from the Python model API.
   */
  async predictTenantScreeningIssues(applicationData: any): Promise<any> {
    try {
      const response = await axios.post('http://localhost:5000/predict', applicationData);
      return response.data;
    } catch (error) {
      throw new Error(`Prediction API error: ${error}`);
    }
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
