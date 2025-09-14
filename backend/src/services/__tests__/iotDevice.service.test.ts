import { jest } from '@jest/globals';
import { iotDeviceService } from '../iotDevice.service';
import { prisma } from '../../config/database';
import { DeviceType, ProtocolType, AlertSeverity, AlertType } from '@prisma/client';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    ioTDevice: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    deviceEvent: {
      create: jest.fn(),
    },
    ioTSensor: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    sensorReading: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    sensorAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    analyticsRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    deviceGroup: {
      create: jest.fn(),
    },
  },
}));

// Mock pubSubService
jest.mock('../pubSub.service', () => ({
  pubSubService: {
    publish: jest.fn(),
  },
}));

// Mock notificationService
jest.mock('../notificationService', () => ({
  sendNotification: jest.fn(),
}));

describe('IoTDeviceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('discoverDevice', () => {
    const mockDeviceData = {
      deviceId: 'test-device-001',
      name: 'Test Device',
      type: DeviceType.SMART_THERMOSTAT,
      protocol: ProtocolType.WIFI,
      macAddress: '00:11:22:33:44:55',
      ipAddress: '192.168.1.100',
      capabilities: { temperature: true, humidity: true },
      metadata: { manufacturer: 'Test Corp' }
    };

    it('should create new device when not found', async () => {
      (prisma.ioTDevice.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.ioTDevice.create as jest.Mock).mockResolvedValue({
        id: 'device-123',
        ...mockDeviceData,
        propertyId: 'property-123',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await iotDeviceService.discoverDevice('property-123', mockDeviceData);

      expect(prisma.ioTDevice.findUnique).toHaveBeenCalledWith({
        where: { deviceId: mockDeviceData.deviceId }
      });
      expect(prisma.ioTDevice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...mockDeviceData,
          propertyId: 'property-123',
          isOnline: true,
          lastSeen: expect.any(Date)
        })
      });
      expect(result).toBeDefined();
    });

    it('should update existing device when found', async () => {
      const existingDevice = {
        id: 'device-123',
        ...mockDeviceData,
        propertyId: 'property-123'
      };

      (prisma.ioTDevice.findUnique as jest.Mock).mockResolvedValue(existingDevice);
      (prisma.ioTDevice.update as jest.Mock).mockResolvedValue({
        ...existingDevice,
        lastSeen: new Date(),
        isOnline: true
      });

      const result = await iotDeviceService.discoverDevice('property-123', mockDeviceData);

      expect(prisma.ioTDevice.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('registerDevice', () => {
    it('should create device with provided data', async () => {
      const deviceData = {
        name: 'New Device',
        type: DeviceType.SMART_LIGHT,
        protocol: ProtocolType.ZIGBEE,
        deviceId: 'zigbee-001'
      };

      (prisma.ioTDevice.create as jest.Mock).mockResolvedValue({
        id: 'device-456',
        ...deviceData,
        propertyId: 'property-123',
        isOnline: true,
        lastSeen: new Date()
      });

      const result = await iotDeviceService.registerDevice('property-123', deviceData);

      expect(prisma.ioTDevice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...deviceData,
          propertyId: 'property-123',
          isOnline: true,
          lastSeen: expect.any(Date)
        })
      });
      expect(result).toBeDefined();
    });
  });

  describe('getDevicesByProperty', () => {
    it('should return devices with related data', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          name: 'Device 1',
          sensors: [{ id: 'sensor-1', isActive: true }],
          group: null,
          events: []
        }
      ];

      (prisma.ioTDevice.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const result = await iotDeviceService.getDevicesByProperty('property-123');

      expect(prisma.ioTDevice.findMany).toHaveBeenCalledWith({
        where: { propertyId: 'property-123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual(mockDevices);
    });
  });

  describe('getDeviceById', () => {
    it('should return device with full details', async () => {
      const mockDevice = {
        id: 'device-123',
        name: 'Test Device',
        sensors: [],
        events: [],
        property: { id: 'prop-1', title: 'Test Property' }
      };

      (prisma.ioTDevice.findUnique as jest.Mock).mockResolvedValue(mockDevice);

      const result = await iotDeviceService.getDeviceById('device-123');

      expect(result).toEqual(mockDevice);
    });

    it('should return null for non-existent device', async () => {
      (prisma.ioTDevice.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await iotDeviceService.getDeviceById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateDeviceStatus', () => {
    it('should update device online status', async () => {
      const mockDevice = {
        id: 'device-123',
        name: 'Test Device',
        isOnline: false
      };

      (prisma.ioTDevice.update as jest.Mock).mockResolvedValue({
        ...mockDevice,
        isOnline: true,
        lastSeen: new Date()
      });

      const result = await iotDeviceService.updateDeviceStatus('device-123', true);

      expect(prisma.ioTDevice.update).toHaveBeenCalledWith({
        where: { id: 'device-123' },
        data: expect.objectContaining({
          isOnline: true,
          lastSeen: expect.any(Date)
        })
      });
      expect(result).toBeDefined();
    });

    it('should return null for non-existent device', async () => {
      (prisma.ioTDevice.update as jest.Mock).mockResolvedValue(null);

      const result = await iotDeviceService.updateDeviceStatus('non-existent', true);

      expect(result).toBeNull();
    });
  });

  describe('createSensor', () => {
    it('should create sensor for device', async () => {
      const sensorData = {
        sensorType: 'TEMPERATURE' as any,
        name: 'Temperature Sensor',
        unit: '°C',
        minValue: -10,
        maxValue: 50
      };

      (prisma.ioTSensor.create as jest.Mock).mockResolvedValue({
        id: 'sensor-123',
        deviceId: 'device-123',
        ...sensorData
      });

      const result = await iotDeviceService.createSensor('device-123', sensorData);

      expect(prisma.ioTSensor.create).toHaveBeenCalledWith({
        data: {
          deviceId: 'device-123',
          ...sensorData
        }
      });
      expect(result).toBeDefined();
    });
  });

  describe('recordSensorReading', () => {
    it('should record sensor reading and process analytics', async () => {
      const mockSensor = {
        id: 'sensor-123',
        sensorType: 'TEMPERATURE' as any,
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

      const result = await iotDeviceService.recordSensorReading('sensor-123', 25.5);

      expect(prisma.sensorReading.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sensorId: 'sensor-123',
          value: 25.5,
          timestamp: expect.any(Date),
          quality: 100
        })
      });
      expect(result).toEqual(mockReading);
    });

    it('should throw error for non-existent sensor', async () => {
      (prisma.ioTSensor.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(iotDeviceService.recordSensorReading('non-existent', 25.5))
        .rejects.toThrow('Sensor sensor-123 not found');
    });
  });

  describe('getSensorReadings', () => {
    it('should return sensor readings with filters', async () => {
      const mockReadings = [
        { id: 'reading-1', value: 25.5, timestamp: new Date() },
        { id: 'reading-2', value: 26.0, timestamp: new Date() }
      ];

      (prisma.sensorReading.findMany as jest.Mock).mockResolvedValue(mockReadings);

      const result = await iotDeviceService.getSensorReadings('sensor-123', 10);

      expect(prisma.sensorReading.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { timestamp: 'desc' },
        take: 10
      });
      expect(result).toEqual(mockReadings);
    });
  });

  describe('createSensorAlert', () => {
    it('should create sensor alert', async () => {
      const mockAlert = {
        id: 'alert-123',
        sensorId: 'sensor-123',
        alertType: AlertType.THRESHOLD_EXCEEDED,
        severity: AlertSeverity.HIGH,
        message: 'Temperature too high',
        value: 35,
        threshold: 30
      };

      (prisma.sensorAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await iotDeviceService.createSensorAlert(
        'sensor-123',
        AlertType.THRESHOLD_EXCEEDED,
        AlertSeverity.HIGH,
        'Temperature too high',
        35,
        30
      );

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
      expect(result).toEqual(mockAlert);
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

      const result = await iotDeviceService.acknowledgeAlert('alert-123', 'user-123');

      expect(prisma.sensorAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-123' },
        data: expect.objectContaining({
          acknowledged: true,
          acknowledgedBy: 'user-123',
          acknowledgedAt: expect.any(Date)
        })
      });
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

      const result = await iotDeviceService.resolveAlert('alert-123');

      expect(prisma.sensorAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-123' },
        data: expect.objectContaining({
          resolved: true,
          resolvedAt: expect.any(Date)
        })
      });
      expect(result).toEqual(mockAlert);
    });
  });

  describe('createAnalyticsRule', () => {
    it('should create analytics rule', async () => {
      const ruleData = {
        name: 'Temperature Alert Rule',
        description: 'Alert when temperature exceeds threshold',
        sensorType: 'TEMPERATURE' as any,
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

      const result = await iotDeviceService.createAnalyticsRule('property-123', ruleData);

      expect(prisma.analyticsRule.create).toHaveBeenCalledWith({
        data: {
          ...ruleData,
          propertyId: 'property-123'
        }
      });
      expect(result).toEqual(mockRule);
    });
  });

  describe('bulkUpdateDeviceStatus', () => {
    it('should update multiple devices', async () => {
      const deviceIds = ['device-1', 'device-2', 'device-3'];

      await iotDeviceService.bulkUpdateDeviceStatus(deviceIds, true);

      expect(prisma.ioTDevice.updateMany).toHaveBeenCalledWith({
        where: { id: { in: deviceIds } },
        data: expect.objectContaining({
          isOnline: true,
          lastSeen: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      });
    });
  });

  describe('getDevicesByType', () => {
    it('should return devices of specific type', async () => {
      const mockDevices = [
        { id: 'device-1', name: 'Thermostat 1', sensors: [] },
        { id: 'device-2', name: 'Thermostat 2', sensors: [] }
      ];

      (prisma.ioTDevice.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const result = await iotDeviceService.getDevicesByType('property-123', DeviceType.SMART_THERMOSTAT);

      expect(prisma.ioTDevice.findMany).toHaveBeenCalledWith({
        where: {
          propertyId: 'property-123',
          type: DeviceType.SMART_THERMOSTAT
        },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockDevices);
    });
  });

  describe('getOfflineDevices', () => {
    it('should return offline devices', async () => {
      const mockDevices = [
        { id: 'device-1', name: 'Offline Device', lastSeen: new Date(Date.now() - 40 * 60 * 1000) }
      ];

      (prisma.ioTDevice.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const result = await iotDeviceService.getOfflineDevices('property-123', 30);

      expect(result).toEqual(mockDevices);
    });
  });

  describe('getDeviceHealthReport', () => {
    it('should generate health report', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          name: 'Device 1',
          isOnline: true,
          sensors: [{ alerts: [] }]
        },
        {
          id: 'device-2',
          name: 'Device 2',
          isOnline: false,
          sensors: [{ alerts: [{}] }]
        }
      ];

      (prisma.ioTDevice.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const result = await iotDeviceService.getDeviceHealthReport('property-123');

      expect(result).toEqual({
        totalDevices: 2,
        onlineDevices: 1,
        offlineDevices: 1,
        devicesWithAlerts: 1,
        uptime: 50,
        devices: expect.any(Array)
      });
    });
  });
});