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

  async getTenantScreeningAlerts(): Promise<any> {
    try {
      // Mock implementation for now - replace with actual API call when available
      return {
        alerts: [
          {
            id: 1,
            type: 'credit_score',
            severity: 'high',
            message: 'Credit score below threshold',
            tenantId: 'tenant_123',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            type: 'income_verification',
            severity: 'medium',
            message: 'Income verification pending',
            tenantId: 'tenant_456',
            createdAt: new Date().toISOString()
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to fetch tenant screening alerts: ${error}`);
    }
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
