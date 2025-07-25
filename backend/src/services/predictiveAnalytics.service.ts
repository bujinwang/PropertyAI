import { spawn } from 'child_process';
import path from 'path';
import axios from 'axios';
import { aiOrchestrationService } from './aiOrchestration.service';

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

  async getTenantScreeningAlerts(): Promise<any> {
    try {
      const prompt = `Generate a list of tenant screening alerts based on the following data: ${JSON.stringify(
        {} // In a real scenario, you'd pass actual tenant data here
      )}.
      
      Each alert should have a type, severity (low, medium, high), message, and a tenantId.`;

      const result = await aiOrchestrationService.generateText(prompt);
      // Assuming the AI returns a JSON string that can be parsed into an array of alerts
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Failed to fetch tenant screening alerts: ${error}`);
    }
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
