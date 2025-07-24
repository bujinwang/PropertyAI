import { 
  BuildingHealth, 
  HealthCategory, 
  MaintenanceHotspot, 
  PredictiveAlert, 
  AIRecommendation,
  BuildingSystem,
  HealthMetrics,
  SystemAlert,
  MaintenanceSchedule
} from '../types/building-health';
import { apiService } from './api';

export class BuildingHealthService {
  /**
   * Get building health overview
   */
  static async getBuildingHealth(buildingId?: string): Promise<BuildingHealth> {
    try {
      const params = buildingId ? `?buildingId=${buildingId}` : '';
      const response = await apiService.get(`/api/building-health${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching building health:', error);
      throw new Error('Failed to fetch building health data');
    }
  }

  /**
   * Get building systems with real-time status
   */
  static async getBuildingSystems(buildingId?: string): Promise<BuildingSystem[]> {
    try {
      const params = buildingId ? `?buildingId=${buildingId}` : '';
      const response = await apiService.get(`/api/building-health/systems${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching building systems:', error);
      throw new Error('Failed to fetch building systems');
    }
  }

  /**
   * Get health metrics with historical trends
   */
  static async getHealthMetrics(
    timeRange: '7d' | '30d' | '90d' = '30d',
    buildingId?: string
  ): Promise<HealthMetrics> {
    try {
      const params = new URLSearchParams();
      params.append('range', timeRange);
      if (buildingId) params.append('buildingId', buildingId);

      const response = await apiService.get(`/api/building-health/metrics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      throw new Error('Failed to fetch health metrics');
    }
  }

  /**
   * Get maintenance hotspots
   */
  static async getMaintenanceHotspots(buildingId?: string): Promise<MaintenanceHotspot[]> {
    try {
      const params = buildingId ? `?buildingId=${buildingId}` : '';
      const response = await apiService.get(`/api/building-health/hotspots${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance hotspots:', error);
      throw new Error('Failed to fetch maintenance hotspots');
    }
  }

  /**
   * Get predictive alerts
   */
  static async getPredictiveAlerts(
    severity?: 'low' | 'medium' | 'high',
    buildingId?: string
  ): Promise<PredictiveAlert[]> {
    try {
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      if (buildingId) params.append('buildingId', buildingId);

      const response = await apiService.get(`/api/building-health/alerts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching predictive alerts:', error);
      throw new Error('Failed to fetch predictive alerts');
    }
  }

  /**
   * Get AI recommendations
   */
  static async getAIRecommendations(
    category?: string,
    priority?: string,
    buildingId?: string
  ): Promise<AIRecommendation[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (priority) params.append('priority', priority);
      if (buildingId) params.append('buildingId', buildingId);

      const response = await apiService.get(`/api/building-health/recommendations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      throw new Error('Failed to fetch AI recommendations');
    }
  }

  /**
   * Update system status
   */
  static async updateSystemStatus(
    systemId: string,
    status: BuildingSystem['status'],
    notes?: string
  ): Promise<void> {
    try {
      await apiService.put(`/api/building-health/systems/${systemId}/status`, {
        status,
        notes
      });
    } catch (error) {
      console.error('Error updating system status:', error);
      throw new Error('Failed to update system status');
    }
  }

  /**
   * Acknowledge alert
   */
  static async acknowledgeAlert(alertId: string, notes?: string): Promise<void> {
    try {
      await apiService.put(`/api/building-health/alerts/${alertId}/acknowledge`, {
        notes,
        acknowledgedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }

  /**
   * Get system alerts
   */
  static async getSystemAlerts(
    systemId?: string,
    severity?: 'info' | 'warning' | 'error'
  ): Promise<SystemAlert[]> {
    try {
      const params = new URLSearchParams();
      if (systemId) params.append('systemId', systemId);
      if (severity) params.append('severity', severity);

      const response = await apiService.get(`/api/building-health/system-alerts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      throw new Error('Failed to fetch system alerts');
    }
  }

  /**
   * Get maintenance schedules
   */
  static async getMaintenanceSchedules(
    systemId?: string,
    upcomingOnly?: boolean
  ): Promise<MaintenanceSchedule[]> {
    try {
      const params = new URLSearchParams();
      if (systemId) params.append('systemId', systemId);
      if (upcomingOnly) params.append('upcomingOnly', 'true');

      const response = await apiService.get(`/api/building-health/maintenance-schedules?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      throw new Error('Failed to fetch maintenance schedules');
    }
  }

  /**
   * Schedule maintenance
   */
  static async scheduleMaintenance(
    systemId: string,
    schedule: {
      type: 'preventive' | 'corrective' | 'emergency';
      description: string;
      scheduledDate: string;
      estimatedDuration: number;
      priority: 'low' | 'medium' | 'high';
      assignedTo?: string;
    }
  ): Promise<MaintenanceSchedule> {
    try {
      const response = await apiService.post(`/api/building-health/maintenance-schedules`, {
        systemId,
        ...schedule
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      throw new Error('Failed to schedule maintenance');
    }
  }

  /**
   * Get building performance summary
   */
  static async getBuildingPerformanceSummary(
    buildingId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<{
    overallHealth: number;
    systemBreakdowns: Array<{
      system: string;
      breakdowns: number;
      downtime: number;
    }>;
    costAnalysis: {
      maintenanceCosts: number;
      energyCosts: number;
      savings: number;
    };
    efficiencyTrends: Record<string, {
      current: number;
      previous: number;
      change: number;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (buildingId) params.append('buildingId', buildingId);
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }

      const response = await apiService.get(`/api/building-health/performance-summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching building performance summary:', error);
      throw new Error('Failed to fetch building performance summary');
    }
  }

  /**
   * Get energy consumption data
   */
  static async getEnergyConsumption(
    buildingId?: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    consumption: Array<{
      timestamp: string;
      value: number;
      system: string;
    }>;
    average: number;
    peak: number;
    efficiency: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('range', timeRange);
      if (buildingId) params.append('buildingId', buildingId);

      const response = await apiService.get(`/api/building-health/energy-consumption?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching energy consumption:', error);
      throw new Error('Failed to fetch energy consumption data');
    }
  }

  /**
   * Get compliance status
   */
  static async getComplianceStatus(
    buildingId?: string
  ): Promise<{
    overall: number;
    categories: Array<{
      name: string;
      score: number;
      status: 'compliant' | 'warning' | 'non_compliant';
      lastInspection: string;
      nextInspection: string;
    }>;
    upcomingDeadlines: Array<{
      category: string;
      deadline: string;
      description: string;
    }>;
  }> {
    try {
      const params = buildingId ? `?buildingId=${buildingId}` : '';
      const response = await apiService.get(`/api/building-health/compliance${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      throw new Error('Failed to fetch compliance status');
    }
  }

  /**
   * Get sensor data
   */
  static async getSensorData(
    sensorType?: string,
    buildingId?: string,
    limit: number = 100
  ): Promise<Array<{
    sensorId: string;
    type: string;
    value: number;
    unit: string;
    timestamp: string;
    location: string;
  }>> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (sensorType) params.append('type', sensorType);
      if (buildingId) params.append('buildingId', buildingId);

      const response = await apiService.get(`/api/building-health/sensor-data?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      throw new Error('Failed to fetch sensor data');
    }
  }
}

export { BuildingHealthService };