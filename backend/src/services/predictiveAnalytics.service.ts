import { spawn } from 'child_process';
import path from 'path';
import axios from 'axios';

class PredictiveAnalyticsService {
  async getPriceRecommendation(propertyData: any): Promise<any> {
    try {
      const response = await axios.post('http://localhost:5000/predict', [propertyData]);
      const recommendedPrice = response.data[0];
      return { recommendedPrice };
    } catch (error) {
      throw new Error(`Prediction API error: ${error}`);
    }
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
