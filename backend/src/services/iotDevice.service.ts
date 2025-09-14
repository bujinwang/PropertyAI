import { prisma } from '../config/database';
import { IoTDevice, DeviceGroup, DeviceEvent, IoTSensor, SensorReading, SensorAlert, AnalyticsRule, DeviceType, ProtocolType, SensorType, AlertSeverity, AlertType } from '@prisma/client';
import { pubSubService } from './pubSub.service';
import { sendNotification } from './notificationService';

interface DeviceDiscoveryData {
  deviceId: string;
  name: string;
  type: DeviceType;
  protocol: ProtocolType;
  macAddress?: string;
  ipAddress?: string;
  capabilities?: any;
  metadata?: any;
}

interface SensorData {
  sensorId: string;
  value: number;
  timestamp?: Date;
  quality?: number;
}

interface DeviceCommand {
  deviceId: string;
  command: string;
  parameters?: any;
}

class IoTDeviceService {
  // Device Discovery and Registration
  public async discoverDevice(propertyId: string, discoveryData: DeviceDiscoveryData): Promise<IoTDevice> {
    const existingDevice = await prisma.ioTDevice.findUnique({
      where: { deviceId: discoveryData.deviceId }
    });

    if (existingDevice) {
      // Update existing device
      return prisma.ioTDevice.update({
        where: { id: existingDevice.id },
        data: {
          name: discoveryData.name,
          type: discoveryData.type,
          protocol: discoveryData.protocol,
          macAddress: discoveryData.macAddress,
          ipAddress: discoveryData.ipAddress,
          capabilities: discoveryData.capabilities || {},
          metadata: discoveryData.metadata || {},
          lastSeen: new Date(),
          isOnline: true,
          updatedAt: new Date()
        }
      });
    }

    // Create new device
    const device = await prisma.ioTDevice.create({
      data: {
        name: discoveryData.name,
        type: discoveryData.type,
        protocol: discoveryData.protocol,
        deviceId: discoveryData.deviceId,
        macAddress: discoveryData.macAddress,
        ipAddress: discoveryData.ipAddress,
        propertyId: propertyId,
        capabilities: discoveryData.capabilities || {},
        metadata: discoveryData.metadata || {},
        lastSeen: new Date(),
        isOnline: true
      }
    });

    // Publish discovery event
    pubSubService.publish('iot-events', JSON.stringify({
      type: 'DEVICE_DISCOVERED',
      payload: device
    }));

    return device;
  }

  public async registerDevice(propertyId: string, deviceData: Partial<IoTDevice>): Promise<IoTDevice> {
    const device = await prisma.ioTDevice.create({
      data: {
        ...deviceData,
        propertyId,
        isOnline: true,
        lastSeen: new Date()
      } as any
    });

    // Log device registration event
    await this.logDeviceEvent(device.id, 'DEVICE_REGISTERED', {
      deviceId: device.deviceId,
      type: device.type,
      protocol: device.protocol
    });

    return device;
  }

  // Device Management
  public async getDevicesByProperty(propertyId: string): Promise<IoTDevice[]> {
    return prisma.ioTDevice.findMany({
      where: { propertyId },
      include: {
        sensors: {
          where: { isActive: true }
        },
        group: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async getDeviceById(deviceId: string): Promise<IoTDevice | null> {
    return prisma.ioTDevice.findUnique({
      where: { id: deviceId },
      include: {
        sensors: {
          include: {
            readings: {
              orderBy: { timestamp: 'desc' },
              take: 50
            },
            alerts: {
              where: { resolved: false },
              orderBy: { timestamp: 'desc' }
            }
          }
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 20
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true
          }
        }
      }
    });
  }

  public async updateDeviceStatus(deviceId: string, isOnline: boolean, batteryLevel?: number, signalStrength?: number): Promise<IoTDevice | null> {
    const updateData: any = {
      isOnline,
      lastSeen: new Date(),
      updatedAt: new Date()
    };

    if (batteryLevel !== undefined) updateData.batteryLevel = batteryLevel;
    if (signalStrength !== undefined) updateData.signalStrength = signalStrength;

    const device = await prisma.ioTDevice.update({
      where: { id: deviceId },
      data: updateData
    });

    if (device) {
      // Publish status update
      pubSubService.publish('iot-events', JSON.stringify({
        type: 'DEVICE_STATUS_UPDATE',
        payload: device
      }));

      // Log status change event
      await this.logDeviceEvent(deviceId, isOnline ? 'DEVICE_ONLINE' : 'DEVICE_OFFLINE', {
        batteryLevel,
        signalStrength
      });
    }

    return device;
  }

  public async updateDeviceFirmware(deviceId: string, firmwareVersion: string): Promise<IoTDevice | null> {
    const device = await prisma.ioTDevice.update({
      where: { id: deviceId },
      data: {
        firmwareVersion,
        updatedAt: new Date()
      }
    });

    if (device) {
      await this.logDeviceEvent(deviceId, 'FIRMWARE_UPDATED', {
        firmwareVersion
      });
    }

    return device;
  }

  // Device Groups
  public async createDeviceGroup(propertyId: string, name: string, description?: string): Promise<DeviceGroup> {
    return prisma.deviceGroup.create({
      data: {
        name,
        description,
        propertyId
      }
    });
  }

  public async addDeviceToGroup(deviceId: string, groupId: string): Promise<IoTDevice | null> {
    return prisma.ioTDevice.update({
      where: { id: deviceId },
      data: { groupId }
    });
  }

  // Device Events
  public async logDeviceEvent(deviceId: string, eventType: string, eventData: any, severity: AlertSeverity = AlertSeverity.LOW): Promise<DeviceEvent> {
    const event = await prisma.deviceEvent.create({
      data: {
        deviceId,
        eventType,
        eventData,
        severity
      }
    });

    // Publish event
    pubSubService.publish('iot-events', JSON.stringify({
      type: 'DEVICE_EVENT',
      payload: event
    }));

    return event;
  }

  // Sensor Management
  public async createSensor(deviceId: string, sensorData: {
    sensorType: SensorType;
    name: string;
    unit: string;
    minValue?: number;
    maxValue?: number;
    precision?: number;
    metadata?: any;
  }): Promise<IoTSensor> {
    return prisma.ioTSensor.create({
      data: {
        deviceId,
        ...sensorData
      }
    });
  }

  public async recordSensorReading(sensorId: string, value: number, timestamp?: Date, quality: number = 100): Promise<SensorReading> {
    const reading = await prisma.sensorReading.create({
      data: {
        sensorId,
        value,
        timestamp: timestamp || new Date(),
        quality
      }
    });

    // Check for alerts based on analytics rules
    await this.checkSensorAlerts(sensorId, value);

    // Publish reading
    pubSubService.publish('sensor-data', JSON.stringify({
      type: 'SENSOR_READING',
      payload: reading
    }));

    return reading;
  }

  public async getSensorReadings(sensorId: string, limit: number = 100, startDate?: Date, endDate?: Date): Promise<SensorReading[]> {
    return prisma.sensorReading.findMany({
      where: {
        sensorId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  // Alert Management
  private async checkSensorAlerts(sensorId: string, value: number): Promise<void> {
    const sensor = await prisma.ioTSensor.findUnique({
      where: { id: sensorId },
      include: { device: true }
    });

    if (!sensor) return;

    // Check threshold alerts
    if (sensor.minValue !== null && value < sensor.minValue) {
      await this.createSensorAlert(sensorId, AlertType.THRESHOLD_EXCEEDED, AlertSeverity.HIGH,
        `Sensor value ${value} below minimum threshold ${sensor.minValue}`, value, sensor.minValue);
    }

    if (sensor.maxValue !== null && value > sensor.maxValue) {
      await this.createSensorAlert(sensorId, AlertType.THRESHOLD_EXCEEDED, AlertSeverity.HIGH,
        `Sensor value ${value} above maximum threshold ${sensor.maxValue}`, value, sensor.maxValue);
    }

    // Check analytics rules
    const rules = await prisma.analyticsRule.findMany({
      where: {
        propertyId: sensor.device.propertyId,
        sensorType: sensor.sensorType,
        isActive: true
      }
    });

    for (const rule of rules) {
      if (await this.evaluateAnalyticsRule(rule, sensorId, value)) {
        await this.createSensorAlert(sensorId, AlertType.PREDICTIVE_FAILURE, rule.severity,
          `Analytics rule "${rule.name}" triggered: ${rule.description}`, value);
      }
    }
  }

  private async evaluateAnalyticsRule(rule: AnalyticsRule, sensorId: string, value: number): Promise<boolean> {
    // Simple threshold-based rule evaluation
    if (rule.threshold && rule.condition) {
      const condition = rule.condition as any;
      if (condition.operator === 'gt' && value > rule.threshold) return true;
      if (condition.operator === 'lt' && value < rule.threshold) return true;
      if (condition.operator === 'eq' && Math.abs(value - rule.threshold) < 0.01) return true;
    }
    return false;
  }

  public async createSensorAlert(sensorId: string, alertType: AlertType, severity: AlertSeverity,
    message: string, value: number, threshold?: number): Promise<SensorAlert> {

    const alert = await prisma.sensorAlert.create({
      data: {
        sensorId,
        alertType,
        severity,
        message,
        value,
        threshold
      }
    });

    // Publish alert
    pubSubService.publish('iot-alerts', JSON.stringify({
      type: 'SENSOR_ALERT',
      payload: alert
    }));

    // Send notification for critical alerts
    if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.HIGH) {
      const sensor = await prisma.ioTSensor.findUnique({
        where: { id: sensorId },
        include: { device: { include: { property: true } } }
      });

      if (sensor?.device?.property) {
        await sendNotification('email', 'admin@propertyai.com', 'IoT Sensor Alert',
          `Alert: ${message} at ${sensor.device.property.title}`);
      }
    }

    return alert;
  }

  public async acknowledgeAlert(alertId: string, userId: string): Promise<SensorAlert | null> {
    return prisma.sensorAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date()
      }
    });
  }

  public async resolveAlert(alertId: string): Promise<SensorAlert | null> {
    return prisma.sensorAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date()
      }
    });
  }

  // Analytics Rules
  public async createAnalyticsRule(propertyId: string, ruleData: {
    name: string;
    description?: string;
    sensorType?: SensorType;
    condition: any;
    threshold?: number;
    timeWindow?: number;
    severity?: AlertSeverity;
  }): Promise<AnalyticsRule> {
    return prisma.analyticsRule.create({
      data: {
        ...ruleData,
        propertyId
      }
    });
  }

  // Bulk Operations
  public async bulkUpdateDeviceStatus(deviceIds: string[], isOnline: boolean): Promise<void> {
    await prisma.ioTDevice.updateMany({
      where: { id: { in: deviceIds } },
      data: {
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date()
      }
    });

    // Publish bulk update
    pubSubService.publish('iot-events', JSON.stringify({
      type: 'BULK_DEVICE_STATUS_UPDATE',
      payload: { deviceIds, isOnline }
    }));
  }

  public async getDevicesByType(propertyId: string, deviceType: DeviceType): Promise<IoTDevice[]> {
    return prisma.ioTDevice.findMany({
      where: {
        propertyId,
        type: deviceType
      },
      include: {
        sensors: {
          where: { isActive: true }
        }
      }
    });
  }

  public async getOfflineDevices(propertyId: string, minutesOffline: number = 30): Promise<IoTDevice[]> {
    const offlineThreshold = new Date(Date.now() - minutesOffline * 60 * 1000);

    return prisma.ioTDevice.findMany({
      where: {
        propertyId,
        OR: [
          { lastSeen: { lt: offlineThreshold } },
          { isOnline: false }
        ]
      }
    });
  }

  // Protocol Adapters (basic implementations)
  public async sendDeviceCommand(command: DeviceCommand): Promise<boolean> {
    const device = await prisma.ioTDevice.findUnique({
      where: { id: command.deviceId }
    });

    if (!device) return false;

    // Log command event
    await this.logDeviceEvent(command.deviceId, 'COMMAND_SENT', {
      command: command.command,
      parameters: command.parameters
    });

    // Here you would integrate with actual protocol adapters
    // For now, just return success
    return true;
  }

  // Health Monitoring
  public async getDeviceHealthReport(propertyId: string): Promise<any> {
    const devices = await prisma.ioTDevice.findMany({
      where: { propertyId },
      include: {
        sensors: {
          include: {
            alerts: {
              where: {
                resolved: false,
                timestamp: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            }
          }
        }
      }
    });

    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const offlineDevices = totalDevices - onlineDevices;
    const devicesWithAlerts = devices.filter(d =>
      d.sensors.some(s => s.alerts.length > 0)
    ).length;

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesWithAlerts,
      uptime: onlineDevices / totalDevices * 100,
      devices: devices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        isOnline: d.isOnline,
        lastSeen: d.lastSeen,
        batteryLevel: d.batteryLevel,
        alertCount: d.sensors.reduce((sum, s) => sum + s.alerts.length, 0)
      }))
    };
  }
}

export const iotDeviceService = new IoTDeviceService();