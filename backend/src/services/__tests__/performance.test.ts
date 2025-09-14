import { jest } from '@jest/globals';
import { iotDeviceService } from '../iotDevice.service';
import { sensorAnalyticsService } from '../sensorAnalytics.service';
import { iotProtocolAdaptersService } from '../iotProtocolAdapters.service';
import { prisma } from '../../config/database';
import { DeviceType, ProtocolType, SensorType } from '@prisma/client';

// Mock all dependencies
jest.mock('../../config/database', () => ({
  prisma: {
    ioTDevice: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    ioTSensor: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    sensorReading: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    sensorAlert: {
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

describe('IoT Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Response Time Benchmarks', () => {
    it('should register device within 500ms', async () => {
      const deviceData = {
        name: 'Performance Test Device',
        type: DeviceType.SMART_THERMOSTAT,
        protocol: ProtocolType.WIFI,
        deviceId: 'perf-test-device'
      };

      (prisma.ioTDevice.create as jest.Mock).mockResolvedValue({
        id: 'device-123',
        ...deviceData,
        propertyId: 'property-123',
        isOnline: true,
        lastSeen: new Date()
      });

      const startTime = Date.now();
      await iotDeviceService.registerDevice('property-123', deviceData);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500);
      console.log(`Device registration response time: ${responseTime}ms`);
    });

    it('should retrieve device by ID within 500ms', async () => {
      const mockDevice = {
        id: 'device-123',
        name: 'Test Device',
        sensors: [],
        events: [],
        property: { id: 'prop-1', title: 'Test Property' }
      };

      (prisma.ioTDevice.findUnique as jest.Mock).mockResolvedValue(mockDevice);

      const startTime = Date.now();
      await iotDeviceService.getDeviceById('device-123');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500);
      console.log(`Device retrieval response time: ${responseTime}ms`);
    });

    it('should get devices by property within 500ms', async () => {
      const mockDevices = Array.from({ length: 50 }, (_, i) => ({
        id: `device-${i}`,
        name: `Device ${i}`,
        sensors: [],
        group: null,
        events: []
      }));

      (prisma.ioTDevice.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const startTime = Date.now();
      await iotDeviceService.getDevicesByProperty('property-123');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500);
      console.log(`Devices by property response time: ${responseTime}ms`);
    });

    it('should record sensor reading within 500ms', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.TEMPERATURE,
        device: { propertyId: 'property-123' }
      };

      const mockReading = {
        id: 'reading-123',
        sensorId: 'sensor-123',
        value: 25.5,
        timestamp: new Date(),
        quality: 100
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);
      (prisma.sensorReading.create as jest.Mock).mockResolvedValue(mockReading);

      const startTime = Date.now();
      await iotDeviceService.recordSensorReading('sensor-123', 25.5);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500);
      console.log(`Sensor reading record response time: ${responseTime}ms`);
    });

    it('should get analytics dashboard within 500ms', async () => {
      const mockSensors = Array.from({ length: 20 }, (_, i) => ({
        id: `sensor-${i}`,
        name: `Sensor ${i}`,
        sensorType: SensorType.TEMPERATURE,
        isActive: true,
        readings: [{ value: 25, timestamp: new Date() }],
        alerts: []
      }));

      const mockAlerts = Array.from({ length: 10 }, (_, i) => ({
        id: `alert-${i}`,
        sensorName: `Sensor ${i}`,
        deviceName: `Device ${i}`,
        type: 'THRESHOLD_EXCEEDED',
        severity: 'MEDIUM',
        message: `Alert ${i}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      }));

      (prisma.ioTSensor.findMany as jest.Mock).mockResolvedValue(mockSensors);
      (prisma.sensorAlert.findMany as jest.Mock).mockResolvedValue(mockAlerts);

      const startTime = Date.now();
      await sensorAnalyticsService.getAnalyticsDashboard('property-123');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(500);
      console.log(`Analytics dashboard response time: ${responseTime}ms`);
    });
  });

  describe('Data Latency Benchmarks', () => {
    it('should process sensor analytics within 1 second', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.TEMPERATURE,
        device: { propertyId: 'property-123' }
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);
      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue([
        { value: 20, timestamp: new Date() },
        { value: 22, timestamp: new Date() },
        { value: 25, timestamp: new Date() }
      ]);

      const startTime = Date.now();
      await sensorAnalyticsService.processSensorReading('sensor-123', 25);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000);
      console.log(`Sensor analytics processing time: ${processingTime}ms`);
    });

    it('should perform predictive maintenance within 1 second', async () => {
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

      const startTime = Date.now();
      await sensorAnalyticsService.performPredictiveMaintenance('sensor-123');
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000);
      console.log(`Predictive maintenance processing time: ${processingTime}ms`);
    });

    it('should handle batch sensor data within 1 second', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.TEMPERATURE,
        device: { propertyId: 'property-123' }
      };

      const batchData = {
        deviceId: 'device-123',
        sensorReadings: Array.from({ length: 50 }, (_, i) => ({
          sensorId: 'sensor-123',
          value: 20 + i * 0.5,
          timestamp: new Date(),
          quality: 100
        }))
      };

      (prisma.ioTDevice.findUnique as jest.Mock).mockResolvedValue({
        id: 'device-123',
        sensors: [mockSensor]
      });

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      const startTime = Date.now();
      await sensorAnalyticsService.ingestBatchData(batchData);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000);
      console.log(`Batch data processing time: ${processingTime}ms`);
    });
  });

  describe('Concurrent Load Benchmarks', () => {
    it('should handle 100 concurrent device registrations within 5 seconds', async () => {
      const devicePromises = Array.from({ length: 100 }, async (_, i) => {
        const deviceData = {
          name: `Concurrent Device ${i}`,
          type: DeviceType.SMART_LIGHT,
          protocol: ProtocolType.WIFI,
          deviceId: `concurrent-device-${i}`
        };

        (prisma.ioTDevice.create as jest.Mock).mockResolvedValue({
          id: `device-${i}`,
          ...deviceData,
          propertyId: 'property-123',
          isOnline: true,
          lastSeen: new Date()
        });

        return iotDeviceService.registerDevice('property-123', deviceData);
      });

      const startTime = Date.now();
      await Promise.all(devicePromises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000);
      console.log(`100 concurrent registrations total time: ${totalTime}ms`);
    });

    it('should handle 1000 concurrent sensor readings within 10 seconds', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.TEMPERATURE,
        device: { propertyId: 'property-123' }
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);
      (prisma.sensorReading.create as jest.Mock).mockResolvedValue({
        id: 'reading-123',
        sensorId: 'sensor-123',
        value: 25,
        timestamp: new Date(),
        quality: 100
      });

      const readingPromises = Array.from({ length: 1000 }, async (_, i) => {
        return iotDeviceService.recordSensorReading('sensor-123', 20 + Math.random() * 10);
      });

      const startTime = Date.now();
      await Promise.all(readingPromises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000);
      console.log(`1000 concurrent readings total time: ${totalTime}ms`);
    });
  });

  describe('Memory and Resource Benchmarks', () => {
    it('should maintain memory usage within limits during sustained load', async () => {
      const initialMemory = process.memoryUsage();

      // Simulate sustained load
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(sensorAnalyticsService.processSensorReading('sensor-123', 25));
      }

      await Promise.all(promises);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory increase during load: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Protocol Adapter Benchmarks', () => {
    it('should discover devices within 1 second', async () => {
      const startTime = Date.now();
      await iotProtocolAdaptersService.discoverAllDevices();
      const endTime = Date.now();

      const discoveryTime = endTime - startTime;
      expect(discoveryTime).toBeLessThan(1000);
      console.log(`Device discovery time: ${discoveryTime}ms`);
    });

    it('should connect to device within 500ms', async () => {
      const startTime = Date.now();
      await iotProtocolAdaptersService.connectDevice('device-123', ProtocolType.WIFI);
      const endTime = Date.now();

      const connectionTime = endTime - startTime;
      expect(connectionTime).toBeLessThan(500);
      console.log(`Device connection time: ${connectionTime}ms`);
    });

    it('should send command within 500ms', async () => {
      const startTime = Date.now();
      await iotProtocolAdaptersService.sendCommand('device-123', ProtocolType.WIFI, 'get_status');
      const endTime = Date.now();

      const commandTime = endTime - startTime;
      expect(commandTime).toBeLessThan(500);
      console.log(`Command execution time: ${commandTime}ms`);
    });
  });

  describe('Database Query Benchmarks', () => {
    it('should query sensor readings within 500ms', async () => {
      const mockReadings = Array.from({ length: 1000 }, (_, i) => ({
        id: `reading-${i}`,
        sensorId: 'sensor-123',
        value: 20 + Math.random() * 10,
        timestamp: new Date(),
        quality: 100
      }));

      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue(mockReadings);

      const startTime = Date.now();
      await iotDeviceService.getSensorReadings('sensor-123', 1000);
      const endTime = Date.now();

      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(500);
      console.log(`Sensor readings query time: ${queryTime}ms`);
    });

    it('should query historical analytics within 1 second', async () => {
      const mockReadings = Array.from({ length: 10000 }, (_, i) => ({
        value: 20 + Math.sin(i * 0.001) * 5,
        timestamp: new Date(Date.now() - (10000 - i) * 1000),
        quality: 100
      }));

      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue(mockReadings);

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const startTime = Date.now();
      await sensorAnalyticsService.getHistoricalAnalysis('sensor-123', startDate, endDate);
      const endTime = Date.now();

      const analysisTime = endTime - startTime;
      expect(analysisTime).toBeLessThan(1000);
      console.log(`Historical analysis time: ${analysisTime}ms`);
    });
  });

  describe('Error Handling Benchmarks', () => {
    it('should handle device not found errors gracefully within 100ms', async () => {
      (prisma.ioTDevice.findUnique as jest.Mock).mockResolvedValue(null);

      const startTime = Date.now();
      const result = await iotDeviceService.getDeviceById('non-existent');
      const endTime = Date.now();

      const errorTime = endTime - startTime;
      expect(errorTime).toBeLessThan(100);
      expect(result).toBeNull();
      console.log(`Error handling time: ${errorTime}ms`);
    });

    it('should handle invalid sensor data gracefully within 100ms', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: SensorType.TEMPERATURE,
        device: { propertyId: 'property-123' }
      };

      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(mockSensor);

      const startTime = Date.now();
      try {
        await iotDeviceService.recordSensorReading('sensor-123', 999); // Invalid temperature
      } catch (error) {
        // Expected error
      }
      const endTime = Date.now();

      const errorTime = endTime - startTime;
      expect(errorTime).toBeLessThan(100);
      console.log(`Invalid data error handling time: ${errorTime}ms`);
    });
  });
});