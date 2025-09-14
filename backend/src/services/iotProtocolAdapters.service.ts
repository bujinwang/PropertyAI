import { DeviceType, ProtocolType } from '@prisma/client';
import { iotDeviceService } from './iotDevice.service';
import { pubSubService } from './pubSub.service';

// Protocol Adapter Interface
interface IProtocolAdapter {
  protocol: ProtocolType;
  initialize(): Promise<void>;
  discoverDevices(): Promise<any[]>;
  connectDevice(deviceId: string): Promise<boolean>;
  disconnectDevice(deviceId: string): Promise<boolean>;
  sendCommand(deviceId: string, command: string, parameters?: any): Promise<any>;
  getDeviceStatus(deviceId: string): Promise<any>;
  cleanup(): Promise<void>;
}

// MQTT Adapter
class MQTTAdapter implements IProtocolAdapter {
  protocol = ProtocolType.MQTT;
  private client: any = null;
  private connected = false;

  async initialize(): Promise<void> {
    // Initialize MQTT client
    // In production, this would connect to an MQTT broker
    console.log('Initializing MQTT adapter');
    this.connected = true;
  }

  async discoverDevices(): Promise<any[]> {
    // MQTT device discovery logic
    return [];
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    // Connect to MQTT device
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    // Disconnect from MQTT device
    return true;
  }

  async sendCommand(deviceId: string, command: string, parameters?: any): Promise<any> {
    // Send MQTT command
    return { success: true, command, parameters };
  }

  async getDeviceStatus(deviceId: string): Promise<any> {
    // Get MQTT device status
    return { online: true, lastSeen: new Date() };
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      // Cleanup MQTT client
      this.connected = false;
    }
  }
}

// Zigbee Adapter
class ZigbeeAdapter implements IProtocolAdapter {
  protocol = ProtocolType.ZIGBEE;
  private gateway: any = null;

  async initialize(): Promise<void> {
    // Initialize Zigbee gateway
    console.log('Initializing Zigbee adapter');
  }

  async discoverDevices(): Promise<any[]> {
    // Zigbee device discovery
    return [];
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    // Connect to Zigbee device
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    // Disconnect from Zigbee device
    return true;
  }

  async sendCommand(deviceId: string, command: string, parameters?: any): Promise<any> {
    // Send Zigbee command
    return { success: true, command, parameters };
  }

  async getDeviceStatus(deviceId: string): Promise<any> {
    // Get Zigbee device status
    return { online: true, lastSeen: new Date() };
  }

  async cleanup(): Promise<void> {
    // Cleanup Zigbee gateway
  }
}

// Z-Wave Adapter
class ZWaveAdapter implements IProtocolAdapter {
  protocol = ProtocolType.ZWAVE;
  private controller: any = null;

  async initialize(): Promise<void> {
    // Initialize Z-Wave controller
    console.log('Initializing Z-Wave adapter');
  }

  async discoverDevices(): Promise<any[]> {
    // Z-Wave device discovery
    return [];
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    // Connect to Z-Wave device
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    // Disconnect from Z-Wave device
    return true;
  }

  async sendCommand(deviceId: string, command: string, parameters?: any): Promise<any> {
    // Send Z-Wave command
    return { success: true, command, parameters };
  }

  async getDeviceStatus(deviceId: string): Promise<any> {
    // Get Z-Wave device status
    return { online: true, lastSeen: new Date() };
  }

  async cleanup(): Promise<void> {
    // Cleanup Z-Wave controller
  }
}

// Wi-Fi Adapter
class WiFiAdapter implements IProtocolAdapter {
  protocol = ProtocolType.WIFI;
  private networkScanner: any = null;

  async initialize(): Promise<void> {
    // Initialize Wi-Fi network scanner
    console.log('Initializing Wi-Fi adapter');
  }

  async discoverDevices(): Promise<any[]> {
    // Wi-Fi device discovery via network scanning
    return [];
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    // Connect to Wi-Fi device
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    // Disconnect from Wi-Fi device
    return true;
  }

  async sendCommand(deviceId: string, command: string, parameters?: any): Promise<any> {
    // Send Wi-Fi command (HTTP, TCP, etc.)
    return { success: true, command, parameters };
  }

  async getDeviceStatus(deviceId: string): Promise<any> {
    // Get Wi-Fi device status
    return { online: true, lastSeen: new Date() };
  }

  async cleanup(): Promise<void> {
    // Cleanup Wi-Fi connections
  }
}

// Bluetooth LE Adapter
class BluetoothLEAdapter implements IProtocolAdapter {
  protocol = ProtocolType.BLUETOOTH_LE;
  private scanner: any = null;

  async initialize(): Promise<void> {
    // Initialize Bluetooth LE scanner
    console.log('Initializing Bluetooth LE adapter');
  }

  async discoverDevices(): Promise<any[]> {
    // Bluetooth LE device discovery
    return [];
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    // Connect to Bluetooth LE device
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    // Disconnect from Bluetooth LE device
    return true;
  }

  async sendCommand(deviceId: string, command: string, parameters?: any): Promise<any> {
    // Send Bluetooth LE command
    return { success: true, command, parameters };
  }

  async getDeviceStatus(deviceId: string): Promise<any> {
    // Get Bluetooth LE device status
    return { online: true, lastSeen: new Date() };
  }

  async cleanup(): Promise<void> {
    // Cleanup Bluetooth LE connections
  }
}

// Thread/Matter Adapter
class ThreadAdapter implements IProtocolAdapter {
  protocol = ProtocolType.THREAD;
  private borderRouter: any = null;

  async initialize(): Promise<void> {
    // Initialize Thread border router
    console.log('Initializing Thread adapter');
  }

  async discoverDevices(): Promise<any[]> {
    // Thread device discovery
    return [];
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    // Connect to Thread device
    return true;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    // Disconnect from Thread device
    return true;
  }

  async sendCommand(deviceId: string, command: string, parameters?: any): Promise<any> {
    // Send Thread command
    return { success: true, command, parameters };
  }

  async getDeviceStatus(deviceId: string): Promise<any> {
    // Get Thread device status
    return { online: true, lastSeen: new Date() };
  }

  async cleanup(): Promise<void> {
    // Cleanup Thread connections
  }
}

// Protocol Adapter Manager
class IoTProtocolAdaptersService {
  private adapters: Map<ProtocolType, IProtocolAdapter> = new Map();
  private initialized = false;

  constructor() {
    // Register all protocol adapters
    this.adapters.set(ProtocolType.MQTT, new MQTTAdapter());
    this.adapters.set(ProtocolType.ZIGBEE, new ZigbeeAdapter());
    this.adapters.set(ProtocolType.ZWAVE, new ZWaveAdapter());
    this.adapters.set(ProtocolType.WIFI, new WiFiAdapter());
    this.adapters.set(ProtocolType.BLUETOOTH_LE, new BluetoothLEAdapter());
    this.adapters.set(ProtocolType.THREAD, new ThreadAdapter());
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing IoT Protocol Adapters Service');

    // Initialize all adapters
    for (const [protocol, adapter] of this.adapters) {
      try {
        await adapter.initialize();
        console.log(`✅ ${protocol} adapter initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${protocol} adapter:`, error);
      }
    }

    this.initialized = true;
    console.log('IoT Protocol Adapters Service initialized');
  }

  async discoverDevices(protocol: ProtocolType): Promise<any[]> {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`Protocol ${protocol} not supported`);
    }

    try {
      const devices = await adapter.discoverDevices();

      // Publish discovery results
      pubSubService.publish('iot-discovery', JSON.stringify({
        type: 'DEVICES_DISCOVERED',
        protocol,
        devices
      }));

      return devices;
    } catch (error) {
      console.error(`Error discovering devices for ${protocol}:`, error);
      return [];
    }
  }

  async discoverAllDevices(): Promise<Map<ProtocolType, any[]>> {
    const results = new Map<ProtocolType, any[]>();

    for (const protocol of this.adapters.keys()) {
      const devices = await this.discoverDevices(protocol);
      results.set(protocol, devices);
    }

    return results;
  }

  async connectDevice(deviceId: string, protocol: ProtocolType): Promise<boolean> {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`Protocol ${protocol} not supported`);
    }

    try {
      const success = await adapter.connectDevice(deviceId);

      if (success) {
        await iotDeviceService.updateDeviceStatus(deviceId, true);
      }

      return success;
    } catch (error) {
      console.error(`Error connecting device ${deviceId} via ${protocol}:`, error);
      return false;
    }
  }

  async disconnectDevice(deviceId: string, protocol: ProtocolType): Promise<boolean> {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`Protocol ${protocol} not supported`);
    }

    try {
      const success = await adapter.disconnectDevice(deviceId);

      if (success) {
        await iotDeviceService.updateDeviceStatus(deviceId, false);
      }

      return success;
    } catch (error) {
      console.error(`Error disconnecting device ${deviceId} via ${protocol}:`, error);
      return false;
    }
  }

  async sendCommand(deviceId: string, protocol: ProtocolType, command: string, parameters?: any): Promise<any> {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`Protocol ${protocol} not supported`);
    }

    try {
      const result = await adapter.sendCommand(deviceId, command, parameters);

      // Log command in device events
      await iotDeviceService.logDeviceEvent(deviceId, 'COMMAND_EXECUTED', {
        command,
        parameters,
        result
      });

      return result;
    } catch (error) {
      console.error(`Error sending command to device ${deviceId} via ${protocol}:`, error);

      // Log command failure
      await iotDeviceService.logDeviceEvent(deviceId, 'COMMAND_FAILED', {
        command,
        parameters,
        error: error.message
      });

      throw error;
    }
  }

  async getDeviceStatus(deviceId: string, protocol: ProtocolType): Promise<any> {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`Protocol ${protocol} not supported`);
    }

    try {
      return await adapter.getDeviceStatus(deviceId);
    } catch (error) {
      console.error(`Error getting status for device ${deviceId} via ${protocol}:`, error);
      return { online: false, error: error.message };
    }
  }

  getSupportedProtocols(): ProtocolType[] {
    return Array.from(this.adapters.keys());
  }

  isProtocolSupported(protocol: ProtocolType): boolean {
    return this.adapters.has(protocol);
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up IoT Protocol Adapters Service');

    for (const [protocol, adapter] of this.adapters) {
      try {
        await adapter.cleanup();
        console.log(`✅ ${protocol} adapter cleaned up`);
      } catch (error) {
        console.error(`❌ Failed to cleanup ${protocol} adapter:`, error);
      }
    }

    this.initialized = false;
  }

  // Auto-discovery scheduler
  async startAutoDiscovery(intervalMinutes: number = 30): Promise<void> {
    console.log(`Starting auto-discovery every ${intervalMinutes} minutes`);

    const runDiscovery = async () => {
      try {
        const results = await this.discoverAllDevices();

        let totalDevices = 0;
        for (const [protocol, devices] of results) {
          totalDevices += devices.length;
          console.log(`Discovered ${devices.length} devices via ${protocol}`);
        }

        console.log(`Auto-discovery completed: ${totalDevices} devices found`);
      } catch (error) {
        console.error('Auto-discovery error:', error);
      }
    };

    // Run initial discovery
    await runDiscovery();

    // Schedule recurring discovery
    setInterval(runDiscovery, intervalMinutes * 60 * 1000);
  }

  // Device health monitoring
  async monitorDeviceHealth(): Promise<void> {
    console.log('Starting device health monitoring');

    const checkHealth = async () => {
      try {
        // Get all devices and check their status
        const devices = await iotDeviceService.getDevicesByProperty('all'); // This would need to be modified

        for (const device of devices) {
          try {
            const status = await this.getDeviceStatus(device.id, device.protocol);

            if (status.online !== device.isOnline) {
              await iotDeviceService.updateDeviceStatus(device.id, status.online);
            }
          } catch (error) {
            console.error(`Health check failed for device ${device.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Device health monitoring error:', error);
      }
    };

    // Run initial health check
    await checkHealth();

    // Schedule recurring health checks every 5 minutes
    setInterval(checkHealth, 5 * 60 * 1000);
  }
}

export const iotProtocolAdaptersService = new IoTProtocolAdaptersService();