import { jest } from '@jest/globals';
import { sensorAnalyticsService } from '../sensorAnalytics.service';
import { prisma } from '../../config/database';
import { SensorType, AlertSeverity, AlertType } from '@prisma/client';

// Mock dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    ioTSensor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    sensorReading: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    sensorAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    analyticsRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../pubSub.service', () => ({
  pubSubService: {
    publish: jest.fn(),
  },
}));

jest.mock('../notificationService', () => ({
  sendNotification: jest.fn(),
}));

describe('SensorAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSensorReading', () => {
    const mockSensor = {
      id: 'sensor-123',
      sensorType: SensorType.TEMPERATURE,
      device: { propertyId: 'property-123' }
    };

    it('should process temperature reading and generate analytics', async () => {
      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);
      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue([
        { value: 20, timestamp: new Date() },
        { value: 22, timestamp: new Date() },
        { value: 25, timestamp: new Date() }
      ]);

      const results = await sensorAnalyticsService.processSensorReading('sensor-123', 25);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.metric === 'moving_average')).toBe(true);
    });

    it('should detect anomalies', async () => {
      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);
      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({ value: 20 + i * 0.1, timestamp: new Date() }))
      );

      const results = await sensorAnalyticsService.processSensorReading('sensor-123', 50); // Anomalous value

      const anomalyResult = results.find(r => r.metric === 'anomaly_score');
      expect(anomalyResult).toBeDefined();
      expect(anomalyResult?.anomaly).toBe(true);
    });

    it('should calculate trend analysis', async () => {
      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);
      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue([
        { value: 20, timestamp: new Date(Date.now() - 10000) },
        { value: 21, timestamp: new Date(Date.now() - 5000) },
        { value: 22, timestamp: new Date() }
      ]);

      const results = await sensorAnalyticsService.processSensorReading('sensor-123', 23);

      const trendResult = results.find(r => r.metric === 'realtime_trend_slope');
      expect(trendResult).toBeDefined();
      expect(trendResult?.trend).toBe('increasing');
    });
  });

  describe('performPredictiveMaintenance', () => {
    it('should analyze temperature sensor for predictive maintenance', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.TEMPERATURE,
        device: { propertyId: 'property-123' },
        readings: Array.from({ length: 100 }, (_, i) => ({
          value: 25 + Math.sin(i * 0.1) * 5,
          timestamp: new Date(Date.now() - (100 - i) * 60000)
        })),
        alerts: []
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);

      const predictions = await sensorAnalyticsService.performPredictiveMaintenance('sensor-123');

      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should analyze vibration sensor for predictive maintenance', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.VIBRATION,
        device: { propertyId: 'property-123' },
        readings: Array.from({ length: 100 }, (_, i) => ({
          value: 0.5 + i * 0.01, // Increasing vibration
          timestamp: new Date(Date.now() - (100 - i) * 60000)
        })),
        alerts: []
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);

      const predictions = await sensorAnalyticsService.performPredictiveMaintenance('sensor-123');

      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);
    });

    it('should return empty array for insufficient data', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.TEMPERATURE,
        device: { propertyId: 'property-123' },
        readings: [{ value: 25, timestamp: new Date() }],
        alerts: []
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);

      const predictions = await sensorAnalyticsService.performPredictiveMaintenance('sensor-123');

      expect(predictions).toEqual([]);
    });
  });

  describe('getAnalyticsDashboard', () => {
    it('should return dashboard data with summary and alerts', async () => {
      const mockSensors = [
        {
          id: 'sensor-1',
          name: 'Temperature Sensor',
          sensorType: SensorType.TEMPERATURE,
          isActive: true,
          readings: [{ value: 25, timestamp: new Date() }],
          alerts: []
        }
      ];

      const mockAlerts = [
        {
          id: 'alert-1',
          sensorName: 'Temperature Sensor',
          deviceName: 'Thermostat',
          type: 'THRESHOLD_EXCEEDED',
          severity: 'HIGH',
          message: 'Temperature too high',
          timestamp: new Date().toISOString(),
          acknowledged: false
        }
      ];

      (prisma.ioTSensor.findMany as jest.Mock).mockResolvedValue(mockSensors);
      (prisma.sensorAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const dashboard = await sensorAnalyticsService.getAnalyticsDashboard('property-123');

      expect(dashboard.summary.totalSensors).toBe(1);
      expect(dashboard.summary.activeSensors).toBe(1);
      expect(dashboard.recentAlerts).toHaveLength(1);
    });
  });

  describe('getHistoricalAnalysis', () => {
    it('should return historical analysis for sensor', async () => {
      const mockReadings = Array.from({ length: 100 }, (_, i) => ({
        value: 20 + Math.sin(i * 0.1) * 5,
        timestamp: new Date(Date.now() - (100 - i) * 60000),
        quality: 100
      }));

      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue(mockReadings);

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const analysis = await sensorAnalyticsService.getHistoricalAnalysis(
        'sensor-123',
        startDate,
        endDate
      );

      expect(analysis).toBeDefined();
      expect(analysis?.statistics.mean).toBeDefined();
      expect(analysis?.statistics.min).toBeDefined();
      expect(analysis?.statistics.max).toBeDefined();
      expect(analysis?.trend).toBeDefined();
    });

    it('should return null for no data', async () => {
      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue([]);

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const analysis = await sensorAnalyticsService.getHistoricalAnalysis(
        'sensor-123',
        startDate,
        endDate
      );

      expect(analysis).toBeNull();
    });
  });

  describe('exportAnalyticsData', () => {
    it('should export data in JSON format', async () => {
      const mockReadings = [
        {
          id: 'reading-1',
          value: 25.5,
          timestamp: new Date(),
          quality: 100,
          sensor: { name: 'Temp Sensor', device: { name: 'Thermostat' } }
        }
      ];

      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue(mockReadings);

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const data = await sensorAnalyticsService.exportAnalyticsData(
        'sensor-123',
        'json',
        startDate,
        endDate
      );

      expect(typeof data).toBe('string');
      const parsed = JSON.parse(data);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export data in CSV format', async () => {
      const mockReadings = [
        {
          id: 'reading-1',
          value: 25.5,
          timestamp: new Date(),
          quality: 100,
          sensor: { name: 'Temp Sensor', device: { name: 'Thermostat' } }
        }
      ];

      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue(mockReadings);

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const data = await sensorAnalyticsService.exportAnalyticsData(
        'sensor-123',
        'csv',
        startDate,
        endDate
      );

      expect(typeof data).toBe('string');
      expect(data).toContain('timestamp,value,quality,sensor_name,device_name');
    });
  });

  describe('createSensorAlert', () => {
    it('should create sensor alert with notification', async () => {
      const mockSensor = {
        id: 'sensor-123',
        name: 'Temperature Sensor',
        device: {
          id: 'device-123',
          name: 'Thermostat',
          property: { title: 'Test Property' }
        }
      };

      const mockAlert = {
        id: 'alert-123',
        sensorId: 'sensor-123',
        alertType: AlertType.THRESHOLD_EXCEEDED,
        severity: AlertSeverity.HIGH,
        message: 'Temperature too high',
        value: 35,
        threshold: 30
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);
      (prisma.sensorAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await sensorAnalyticsService.createSensorAlert(
        'sensor-123',
        AlertType.THRESHOLD_EXCEEDED,
        AlertSeverity.HIGH,
        'Temperature too high',
        35,
        30
      );

      expect(result).toEqual(mockAlert);
      expect(prisma.sensorAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sensorId: 'sensor-123',
          alertType: AlertType.THRESHOLD_EXCEEDED,
          severity: AlertSeverity.HIGH,
          message: 'Temperature too high',
          value: 35,
          threshold: 30
        })
      });
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', async () => {
      const mockAlert = {
        id: 'alert-123',
        acknowledged: true,
        acknowledgedBy: 'user-123',
        acknowledgedAt: new Date()
      };

      (prisma.sensorAlert.update as jest.Mock).mockResolvedValue(mockAlert);

      const result = await sensorAnalyticsService.acknowledgeAlert('alert-123', 'user-123');

      expect(result).toEqual(mockAlert);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert', async () => {
      const mockAlert = {
        id: 'alert-123',
        resolved: true,
        resolvedAt: new Date()
      };

      (prisma.sensorAlert.update as jest.Mock).mockResolvedValue(mockAlert);

      const result = await sensorAnalyticsService.resolveAlert('alert-123');

      expect(result).toEqual(mockAlert);
    });
  });

  describe('createAnalyticsRule', () => {
    it('should create analytics rule', async () => {
      const ruleData = {
        name: 'Temperature Alert Rule',
        description: 'Alert when temperature exceeds threshold',
        sensorType: SensorType.TEMPERATURE,
        condition: { operator: 'gt', value: 30 },
        threshold: 30,
        severity: AlertSeverity.MEDIUM
      };

      const mockRule = {
        id: 'rule-123',
        propertyId: 'property-123',
        ...ruleData
      };

      (prisma.analyticsRule.create as jest.Mock).mockResolvedValue(mockRule);

      const result = await sensorAnalyticsService.createAnalyticsRule('property-123', ruleData);

      expect(result).toEqual(mockRule);
    });
  });

  describe('processRealTimeAlerts', () => {
    it('should process real-time alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          sensorId: 'sensor-1',
          severity: AlertSeverity.HIGH,
          acknowledged: false,
          resolved: false,
          sensor: {
            name: 'Test Sensor',
            device: {
              name: 'Test Device',
              property: { title: 'Test Property' }
            }
          }
        }
      ];

      (prisma.sensorAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      await sensorAnalyticsService.processRealTimeAlerts();

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });
});