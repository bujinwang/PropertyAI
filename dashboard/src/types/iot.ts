// IoT Types for PropertyAI Dashboard

export enum DeviceType {
  SMART_LOCK = 'SMART_LOCK',
  SMART_THERMOSTAT = 'SMART_THERMOSTAT',
  SMART_LIGHT = 'SMART_LIGHT',
  SECURITY_CAMERA = 'SECURITY_CAMERA',
  MOTION_SENSOR = 'MOTION_SENSOR',
  DOOR_SENSOR = 'DOOR_SENSOR',
  WINDOW_SENSOR = 'WINDOW_SENSOR',
  SMOKE_DETECTOR = 'SMOKE_DETECTOR',
  CARBON_MONOXIDE_DETECTOR = 'CARBON_MONOXIDE_DETECTOR',
  WATER_LEAK_SENSOR = 'WATER_LEAK_SENSOR',
  HVAC_CONTROLLER = 'HVAC_CONTROLLER',
  ENERGY_METER = 'ENERGY_METER',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  ENVIRONMENTAL_SENSOR = 'ENVIRONMENTAL_SENSOR',
  OTHER = 'OTHER'
}

export enum ProtocolType {
  MQTT = 'MQTT',
  ZIGBEE = 'ZIGBEE',
  ZWAVE = 'ZWAVE',
  WIFI = 'WIFI',
  BLUETOOTH_LE = 'BLUETOOTH_LE',
  THREAD = 'THREAD',
  MATTER = 'MATTER',
  OTHER = 'OTHER'
}

export enum SensorType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  MOTION = 'MOTION',
  DOOR_WINDOW = 'DOOR_WINDOW',
  SMOKE = 'SMOKE',
  CARBON_MONOXIDE = 'CARBON_MONOXIDE',
  WATER_LEAK = 'WATER_LEAK',
  ENERGY_CONSUMPTION = 'ENERGY_CONSUMPTION',
  VOLTAGE = 'VOLTAGE',
  CURRENT = 'CURRENT',
  POWER = 'POWER',
  AIR_QUALITY = 'AIR_QUALITY',
  NOISE_LEVEL = 'NOISE_LEVEL',
  LIGHT_LEVEL = 'LIGHT_LEVEL',
  OCCUPANCY = 'OCCUPANCY',
  PRESSURE = 'PRESSURE',
  VIBRATION = 'VIBRATION',
  OTHER = 'OTHER'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertType {
  THRESHOLD_EXCEEDED = 'THRESHOLD_EXCEEDED',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  BATTERY_LOW = 'BATTERY_LOW',
  MALFUNCTION = 'MALFUNCTION',
  SECURITY_BREACH = 'SECURITY_BREACH',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  PREDICTIVE_FAILURE = 'PREDICTIVE_FAILURE',
  OTHER = 'OTHER'
}

export interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  protocol: ProtocolType;
  deviceId: string;
  macAddress?: string;
  ipAddress?: string;
  firmwareVersion?: string;
  lastSeen?: Date;
  isOnline: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  propertyId: string;
  unitId?: string;
  groupId?: string;
  capabilities?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  propertyId: string;
  devices: IoTDevice[];
}

export interface IoTSensor {
  id: string;
  deviceId: string;
  sensorType: SensorType;
  name: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  precision: number;
  isActive: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  timestamp: Date;
  quality: number;
}

export interface SensorAlert {
  id: string;
  sensorId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  threshold?: number;
  value: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AnalyticsRule {
  id: string;
  name: string;
  description?: string;
  sensorType?: SensorType;
  condition: any;
  threshold?: number;
  timeWindow?: number;
  severity: AlertSeverity;
  isActive: boolean;
  propertyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceDiscoveryData {
  deviceId: string;
  name: string;
  type: DeviceType;
  protocol: ProtocolType;
  macAddress?: string;
  ipAddress?: string;
  signalStrength?: number;
  capabilities?: any;
  metadata?: any;
}

export interface SensorDataPoint {
  sensorId: string;
  value: number;
  timestamp?: Date;
  quality?: number;
  metadata?: any;
}

export interface BatchSensorData {
  deviceId: string;
  sensorReadings: SensorDataPoint[];
  timestamp?: Date;
}

export interface DeviceCommand {
  deviceId: string;
  command: string;
  parameters?: any;
}

export interface AnalyticsResult {
  sensorId: string;
  metric: string;
  value: number;
  timestamp: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  anomaly: boolean;
}

export interface PredictiveMaintenanceResult {
  deviceId: string;
  sensorId: string;
  prediction: string;
  confidence: number;
  recommendedAction: string;
  estimatedTimeToFailure?: number;
  timestamp: Date;
}

export interface RealTimeMetric {
  sensorId: string;
  metric: string;
  value: number;
  timestamp: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  anomaly: boolean;
}

export interface AnalyticsPipelineConfig {
  windowSize: number;
  updateInterval: number;
  anomalyThreshold: number;
  enablePredictiveMaintenance: boolean;
}

export interface DataIngestionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  processingTime: number;
}

export interface DeviceHealthReport {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  devicesWithAlerts: number;
  uptime: number;
  devices: Array<{
    id: string;
    name: string;
    type: DeviceType;
    isOnline: boolean;
    lastSeen?: Date;
    batteryLevel?: number;
    alertCount: number;
  }>;
}

export interface HistoricalAnalysis {
  sensorId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  count: number;
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
  };
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  dataPoints: Array<{
    timestamp: Date;
    value: number;
    quality: number;
  }>;
}