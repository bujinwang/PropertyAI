import { api } from './api';
import axios from 'axios';
import { ML_API_URL, ENDPOINTS } from '../constants/api';

// Types for ML predictions
export interface ChurnPredictionRequest {
  tenantId: string;
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    totalPayments: number;
  };
  maintenanceRequests: number;
  leaseMonthsRemaining: number;
  communicationFrequency: number;
}

export interface ChurnPredictionResponse {
  prediction: 'low' | 'medium' | 'high';
  probability: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
}

export interface MaintenancePredictionRequest {
  rentalId: string;
  propertyAge: number;
  propertyType: string;
  squareFeet: number;
  lastMaintenanceDate: string;
  maintenanceHistory: Array<{
    date: string;
    cost: number;
    category: string;
  }>;
  systems: {
    hvac?: { age: number; lastService: string };
    plumbing?: { age: number; lastService: string };
    electrical?: { age: number; lastService: string };
    roof?: { age: number; lastService: string };
  };
}

export interface MaintenancePredictionResponse {
  predictedCost: number;
  costRange: {
    min: number;
    max: number;
  };
  confidence: number;
  breakdown: Array<{
    category: string;
    predictedCost: number;
    probability: number;
    urgency: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
  timeline: string;
}

export interface OccupancyForecastRequest {
  propertyId: string;
  currentOccupancyRate: number;
  historicalData: Array<{
    month: string;
    occupancyRate: number;
    avgRent: number;
  }>;
  marketData?: {
    areaOccupancyRate: number;
    seasonalTrends: string[];
  };
}

export interface OccupancyForecastResponse {
  nextMonthForecast: number;
  nextQuarterForecast: number;
  confidence: number;
  trends: Array<{
    period: string;
    forecast: number;
    factors: string[];
  }>;
  recommendations: string[];
}

export interface RentOptimizationRequest {
  rentalId: string;
  currentRent: number;
  propertyFeatures: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    amenities: string[];
  };
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  marketData?: {
    avgRentInArea: number;
    competitorRents: number[];
  };
}

export interface RentOptimizationResponse {
  recommendedRent: number;
  currentMarketPosition: 'below' | 'at' | 'above';
  adjustmentPercentage: number;
  confidence: number;
  marketAnalysis: {
    avgMarketRent: number;
    competitorRange: { min: number; max: number };
    demandLevel: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
}

/**
 * ML Prediction Service
 * Provides access to ML prediction endpoints for the mobile app
 */
export const mlPredictionService = {
  /**
   * Predict tenant churn risk
   */
  predictChurnRisk: async (data: ChurnPredictionRequest): Promise<ChurnPredictionResponse> => {
    try {
      // Transform data to match ML API format
      const mlPayload = {
        propertyId: data.tenantId, // Using tenantId as propertyId for now
        tenantId: data.tenantId,
        features: {
          paymentHistory: [
            ...Array(data.paymentHistory.onTimePayments).fill(1200),
            ...Array(data.paymentHistory.latePayments).fill(1100),
          ],
          maintenanceRequests: data.maintenanceRequests,
          monthsInProperty: Math.max(12 - data.leaseMonthsRemaining, 1),
          leaseEndDate: new Date(Date.now() + data.leaseMonthsRemaining * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      };

      const response = await axios.post(`${ML_API_URL}${ENDPOINTS.ML.PREDICT_CHURN}`, mlPayload);
      
      // Transform ML API response to match our interface
      return {
        prediction: response.data.riskLevel || 'medium',
        probability: response.data.churnProbability || 0.5,
        confidence: response.data.confidence || 0.75,
        factors: response.data.factors?.map((f: string) => ({
          name: f,
          impact: 0.15,
          description: f,
        })) || [],
        recommendations: response.data.recommendations || [],
      };
    } catch (error) {
      console.error('Error predicting churn risk:', error);
      // Return fallback prediction on error
      return {
        prediction: 'medium',
        probability: 0.5,
        confidence: 0.6,
        factors: [
          {
            name: 'Insufficient Data',
            impact: 0.1,
            description: 'Unable to calculate accurate prediction',
          },
        ],
        recommendations: ['Gather more tenant data for better predictions'],
      };
    }
  },

  /**
   * Predict maintenance costs
   */
  predictMaintenanceCosts: async (
    data: MaintenancePredictionRequest
  ): Promise<MaintenancePredictionResponse> => {
    try {
      // Transform data to match ML API format
      const mlPayload = {
        propertyId: data.rentalId,
        features: {
          propertyAge: data.propertyAge,
          squareFeet: data.squareFeet,
          propertyType: data.propertyType,
          maintenanceHistory: data.maintenanceHistory,
          hvacAge: data.systems.hvac?.age || 10,
          plumbingAge: data.systems.plumbing?.age || 10,
          electricalAge: data.systems.electrical?.age || 10,
          roofAge: data.systems.roof?.age || 10,
        },
      };

      const response = await axios.post(`${ML_API_URL}${ENDPOINTS.ML.PREDICT_MAINTENANCE}`, mlPayload);
      
      // Transform ML API response to match our interface
      const predictedCost = response.data.predictedCost || 2500;
      const costMin = response.data.costMin || Math.round(predictedCost * 0.8);
      const costMax = response.data.costMax || Math.round(predictedCost * 1.2);
      
      // Transform breakdown if available
      const breakdown = response.data.breakdown
        ? Object.entries(response.data.breakdown).map(([category, cost]) => ({
            category,
            predictedCost: cost as number,
            probability: 0.75,
            urgency: (cost as number) > predictedCost * 0.3 ? 'high' : 'medium',
          }))
        : [];
      
      return {
        predictedCost,
        costRange: { min: costMin, max: costMax },
        confidence: response.data.confidence || 0.75,
        breakdown,
        recommendations: response.data.insights || response.data.recommendations || [],
        timeline: response.data.estimatedTimeframe || 'Next 6-12 months',
      };
    } catch (error) {
      console.error('Error predicting maintenance costs:', error);
      // Return fallback prediction on error
      return {
        predictedCost: 2500,
        costRange: { min: 2000, max: 3000 },
        confidence: 0.6,
        breakdown: [
          {
            category: 'General Maintenance',
            predictedCost: 2500,
            probability: 0.7,
            urgency: 'medium',
          },
        ],
        recommendations: ['Schedule property inspection for accurate assessment'],
        timeline: 'Next 3-6 months',
      };
    }
  },

  /**
   * Forecast occupancy rates
   */
  forecastOccupancy: async (
    data: OccupancyForecastRequest
  ): Promise<OccupancyForecastResponse> => {
    try {
      // TODO: Implement when ML API endpoint is available
      // const response = await axios.post(`${ML_API_URL}/forecast/occupancy`, data);
      
      // For now, return rule-based forecast
      const currentRate = data.currentOccupancyRate;
      const trend = data.historicalData && data.historicalData.length > 0
        ? (data.historicalData[data.historicalData.length - 1].occupancyRate - data.historicalData[0].occupancyRate) / data.historicalData.length
        : 0.01;
      
      return {
        nextMonthForecast: Math.min(0.99, Math.max(0.5, currentRate + trend)),
        nextQuarterForecast: Math.min(0.99, Math.max(0.5, currentRate + trend * 3)),
        confidence: 0.7,
        trends: [
          {
            period: 'Next Month',
            forecast: currentRate + trend,
            factors: data.marketData?.seasonalTrends || ['Historical trends'],
          },
        ],
        recommendations: [
          currentRate < 0.85 ? 'Consider marketing campaigns to increase occupancy' : 'Maintain current tenant satisfaction',
          'Monitor market conditions',
        ],
      };
    } catch (error) {
      console.error('Error forecasting occupancy:', error);
      throw error;
    }
  },

  /**
   * Optimize rental pricing
   */
  optimizeRent: async (data: RentOptimizationRequest): Promise<RentOptimizationResponse> => {
    try {
      // TODO: Implement when ML API endpoint is available
      // const response = await axios.post(`${ML_API_URL}/optimize/rent`, data);
      
      // For now, return rule-based optimization
      const basePrice = data.currentRent;
      const bedroomMultiplier = data.propertyFeatures.bedrooms * 300;
      const bathroomMultiplier = data.propertyFeatures.bathrooms * 150;
      const sqftMultiplier = data.propertyFeatures.squareFeet * 0.5;
      
      const marketEstimate = basePrice + bedroomMultiplier + bathroomMultiplier + (sqftMultiplier - basePrice) * 0.1;
      const recommendedRent = Math.round(marketEstimate / 50) * 50; // Round to nearest 50
      
      const adjustment = ((recommendedRent - basePrice) / basePrice) * 100;
      
      let position: 'below' | 'at' | 'above' = 'at';
      if (recommendedRent > basePrice * 1.05) position = 'below';
      if (recommendedRent < basePrice * 0.95) position = 'above';
      
      return {
        recommendedRent,
        currentMarketPosition: position,
        adjustmentPercentage: adjustment,
        confidence: 0.75,
        marketAnalysis: {
          avgMarketRent: recommendedRent,
          competitorRange: {
            min: Math.round(recommendedRent * 0.9),
            max: Math.round(recommendedRent * 1.1),
          },
          demandLevel: data.marketData?.avgRentInArea && data.currentRent < data.marketData.avgRentInArea * 0.9 ? 'high' : 'medium',
        },
        recommendations: [
          adjustment > 5 ? 'Consider gradual rent increase to match market' : 'Current pricing is competitive',
          'Monitor competitor pricing regularly',
        ],
      };
    } catch (error) {
      console.error('Error optimizing rent:', error);
      throw error;
    }
  },

  /**
   * Get ML model health status
   */
  getModelHealth: async (): Promise<{
    status: string;
    models: Array<{
      name: string;
      version: string;
      accuracy: number;
      lastTrained: string;
    }>;
  }> => {
    try {
      const response = await api.get('/ml/health');
      return response;
    } catch (error) {
      console.error('Error getting ML model health:', error);
      throw error;
    }
  },

  /**
   * Batch predict churn for multiple tenants
   */
  batchPredictChurn: async (
    tenantIds: string[]
  ): Promise<Array<ChurnPredictionResponse & { tenantId: string }>> => {
    try {
      const response = await api.post('/ml/predict/churn/batch', { tenantIds });
      return response;
    } catch (error) {
      console.error('Error batch predicting churn:', error);
      throw error;
    }
  },

  /**
   * Get prediction history for a tenant
   */
  getChurnHistory: async (tenantId: string): Promise<{
    predictions: Array<{
      date: string;
      prediction: string;
      probability: number;
      confidence: number;
    }>;
  }> => {
    try {
      const response = await api.get(`/ml/predict/churn/history/${tenantId}`);
      return response;
    } catch (error) {
      console.error('Error getting churn history:', error);
      throw error;
    }
  },

  /**
   * Get maintenance prediction history for a rental
   */
  getMaintenanceHistory: async (rentalId: string): Promise<{
    predictions: Array<{
      date: string;
      predictedCost: number;
      actualCost?: number;
      accuracy?: number;
    }>;
  }> => {
    try {
      const response = await api.get(`/ml/predict/maintenance/history/${rentalId}`);
      return response;
    } catch (error) {
      console.error('Error getting maintenance history:', error);
      throw error;
    }
  },
};
