import { apiService } from './apiService';

export const predictiveMaintenanceService = {
  // Fetches predicted maintenance data for a specific property
  getPredictions: async (propertyId: string) => {
    try {
      const response = await apiService.post('/analytics/predict-maintenance', { propertyId });
      return response.data;
    } catch (error) {
      console.error('Error fetching predictive maintenance data:', error);
      throw error;
    }
  },

  // Converts a predicted maintenance item into a work order
  createWorkOrderFromPrediction: async (predictionId: string) => {
    try {
      const response = await apiService.post('/work-orders', { predictionId });
      return response.data;
    } catch (error) {
      console.error('Error creating work order from prediction:', error);
      throw error;
    }
  },
};
