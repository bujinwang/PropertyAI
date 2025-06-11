import { apiService } from './apiService';

export const predictiveMaintenanceService = {
  // Fetches predicted maintenance data
  getPredictions: async (filters: any) => {
    try {
      const response = await apiService.get('/predictive-maintenance', { params: filters });
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
