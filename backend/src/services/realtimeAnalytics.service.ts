import { prisma } from '../config/database';
import { SensorReading, SensorType, AlertSeverity } from '@prisma/client';
import { sensorAnalyticsService } from './sensorAnalytics.service';
import { pubSubService } from './pubSub.service';
import { sendNotification } from './notificationService';

interface RealTimeMetric {
  sensorId: string;
  metric: string;
  value: number;
  timestamp: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  anomaly: boolean;
}

interface AnalyticsPipelineConfig {
  windowSize: number; // Number of readings to keep in memory
  updateInterval: number; // How often to publish updates (ms)
  anomalyThreshold: number; // Z-score threshold for anomalies
  enablePredictiveMaintenance: boolean;
}

class RealTimeAnalyticsService {
  private sensorBuffers: Map<string, SensorReading[]> = new Map();
  private activeSubscriptions: Map<string, NodeJS.Timeout> = new Map();
  private pipelineConfigs: Map<string, AnalyticsPipelineConfig> = new Map();

  // Default configuration
  private defaultConfig: AnalyticsPipelineConfig = {
    windowSize: 100,
    updateInterval: 5000, // 5 seconds
    anomalyThreshold: 3.0,
    enablePredictiveMaintenance: true
  };

  // Start Real-time Analytics Pipeline
  public async startAnalyticsPipeline(sensorId: string, config?: Partial<AnalyticsPipelineConfig>): Promise<string> {
    const pipelineConfig = { ...this.defaultConfig, ...config };
    const pipelineId = `pipeline_${sensorId}_${Date.now()}`;

    // Initialize sensor buffer
    this.sensorBuffers.set(sensorId, []);
    this.pipelineConfigs.set(sensorId, pipelineConfig);

    // Start periodic analytics processing
    const intervalId = setInterval(async () => {
      try {
        await this.processAnalytics(sensorId, pipelineConfig);
      } catch (error) {
        console.error(`Error in analytics pipeline for sensor ${sensorId}:`, error);
      }
    }, pipelineConfig.updateInterval);

    this.activeSubscriptions.set(pipelineId, intervalId);

    console.log(`Started real-time analytics pipeline for sensor ${sensorId}: ${pipelineId}`);
    return pipelineId;
  }

  // Stop Analytics Pipeline
  public stopAnalyticsPipeline(pipelineId: string): boolean {
    const intervalId = this.activeSubscriptions.get(pipelineId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeSubscriptions.delete(pipelineId);

      // Clean up sensor buffer
      const sensorId = pipelineId.split('_')[1];
      this.sensorBuffers.delete(sensorId);
      this.pipelineConfigs.delete(sensorId);

      console.log(`Stopped analytics pipeline: ${pipelineId}`);
      return true;
    }
    return false;
  }

  // Process Real-time Analytics
  private async processAnalytics(sensorId: string, config: AnalyticsPipelineConfig): Promise<void> {
    const buffer = this.sensorBuffers.get(sensorId);
    if (!buffer || buffer.length === 0) return;

    const latestReading = buffer[buffer.length - 1];
    const metrics: RealTimeMetric[] = [];

    // Calculate real-time metrics
    const realTimeMetrics = await this.calculateRealTimeMetrics(sensorId, buffer, config);
    metrics.push(...realTimeMetrics);

    // Detect anomalies
    const anomalyMetrics = await this.detectRealTimeAnomalies(sensorId, buffer, config);
    metrics.push(...anomalyMetrics);

    // Calculate trends
    const trendMetrics = await this.calculateRealTimeTrends(sensorId, buffer);
    metrics.push(...trendMetrics);

    // Publish real-time updates
    if (metrics.length > 0) {
      pubSubService.publish('realtime-analytics', JSON.stringify({
        type: 'ANALYTICS_UPDATE',
        sensorId,
        metrics,
        timestamp: new Date()
      }));
    }

    // Process predictive maintenance if enabled
    if (config.enablePredictiveMaintenance && buffer.length >= 50) {
      await this.processPredictiveMaintenance(sensorId, buffer);
    }

    // Maintain buffer size
    if (buffer.length > config.windowSize) {
      buffer.splice(0, buffer.length - config.windowSize);
    }
  }

  // Add Reading to Analytics Pipeline
  public async addReadingToPipeline(sensorId: string, reading: SensorReading): Promise<void> {
    let buffer = this.sensorBuffers.get(sensorId);
    if (!buffer) {
      buffer = [];
      this.sensorBuffers.set(sensorId, buffer);
    }

    buffer.push(reading);

    // Trigger immediate processing for critical sensors
    const sensor = await prisma.ioTSensor.findUnique({
      where: { id: sensorId },
      select: { sensorType: true }
    });

    if (sensor && this.isCriticalSensor(sensor.sensorType)) {
      const config = this.pipelineConfigs.get(sensorId) || this.defaultConfig;
      await this.processAnalytics(sensorId, config);
    }
  }

  private isCriticalSensor(sensorType: SensorType): boolean {
    return [
      SensorType.SMOKE,
      SensorType.CARBON_MONOXIDE,
      SensorType.WATER_LEAK,
      SensorType.SECURITY_CAMERA
    ].includes(sensorType);
  }

  // Real-time Metrics Calculation
  private async calculateRealTimeMetrics(sensorId: string, buffer: SensorReading[], config: AnalyticsPipelineConfig): Promise<RealTimeMetric[]> {
    const metrics: RealTimeMetric[] = [];
    const values = buffer.map(r => r.value);
    const latestValue = values[values.length - 1];
    const timestamp = new Date();

    // Moving Average
    const windowSize = Math.min(20, values.length);
    const recentValues = values.slice(-windowSize);
    const movingAverage = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;

    metrics.push({
      sensorId,
      metric: 'moving_average',
      value: movingAverage,
      timestamp,
      trend: 'stable',
      anomaly: false
    });

    // Rate of Change
    if (values.length >= 2) {
      const previousValue = values[values.length - 2];
      const rateOfChange = ((latestValue - previousValue) / previousValue) * 100;

      metrics.push({
        sensorId,
        metric: 'rate_of_change_percent',
        value: rateOfChange,
        timestamp,
        trend: rateOfChange > 1 ? 'increasing' : rateOfChange < -1 ? 'decreasing' : 'stable',
        anomaly: Math.abs(rateOfChange) > 10 // 10% change is anomalous
      });
    }

    // Volatility (standard deviation of recent readings)
    if (recentValues.length >= 5) {
      const mean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length;
      const volatility = Math.sqrt(variance);

      metrics.push({
        sensorId,
        metric: 'volatility',
        value: volatility,
        timestamp,
        trend: 'stable',
        anomaly: false
      });
    }

    return metrics;
  }

  // Real-time Anomaly Detection
  private async detectRealTimeAnomalies(sensorId: string, buffer: SensorReading[], config: AnalyticsPipelineConfig): Promise<RealTimeMetric[]> {
    const metrics: RealTimeMetric[] = [];
    const values = buffer.map(r => r.value);

    if (values.length < 10) return metrics;

    const latestValue = values[values.length - 1];
    const historicalValues = values.slice(0, -1);

    // Calculate z-score
    const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const stdDev = Math.sqrt(variance);
    const zScore = stdDev > 0 ? Math.abs((latestValue - mean) / stdDev) : 0;

    const isAnomaly = zScore > config.anomalyThreshold;

    metrics.push({
      sensorId,
      metric: 'anomaly_score',
      value: zScore,
      timestamp: new Date(),
      trend: 'stable',
      anomaly: isAnomaly
    });

    // Trigger alert for anomalies
    if (isAnomaly) {
      await this.triggerAnomalyAlert(sensorId, latestValue, zScore);
    }

    return metrics;
  }

  // Real-time Trend Analysis
  private async calculateRealTimeTrends(sensorId: string, buffer: SensorReading[]): Promise<RealTimeMetric[]> {
    const metrics: RealTimeMetric[] = [];

    if (buffer.length < 5) return metrics;

    const values = buffer.map(r => r.value);
    const timestamps = buffer.map(r => r.timestamp.getTime());

    // Simple linear regression for trend
    const n = values.length;
    const sumX = timestamps.reduce((sum, _, index) => sum + index, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = timestamps.reduce((sum, _, index) => sum + index * values[index], 0);
    const sumXX = timestamps.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (slope > 0.01) trend = 'increasing';
    else if (slope < -0.01) trend = 'decreasing';

    metrics.push({
      sensorId,
      metric: 'realtime_trend_slope',
      value: slope,
      timestamp: new Date(),
      trend,
      anomaly: false
    });

    return metrics;
  }

  // Predictive Maintenance Processing
  private async processPredictiveMaintenance(sensorId: string, buffer: SensorReading[]): Promise<void> {
    const sensor = await prisma.ioTSensor.findUnique({
      where: { id: sensorId },
      include: { device: true }
    });

    if (!sensor) return;

    const predictions = await sensorAnalyticsService.performPredictiveMaintenance(sensorId);

    if (predictions.length > 0) {
      // Publish predictive maintenance alerts
      pubSubService.publish('predictive-maintenance', JSON.stringify({
        type: 'PREDICTIVE_ALERT',
        sensorId,
        deviceId: sensor.deviceId,
        predictions,
        timestamp: new Date()
      }));

      // Send notifications for high-confidence predictions
      const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8);
      for (const prediction of highConfidencePredictions) {
        await sendNotification(
          'email',
          'maintenance@propertyai.com',
          'Predictive Maintenance Alert',
          `Device ${sensor.device.name}: ${prediction.prediction}. ${prediction.recommendedAction}`
        );
      }
    }
  }

  // Anomaly Alert Triggering
  private async triggerAnomalyAlert(sensorId: string, value: number, zScore: number): Promise<void> {
    const sensor = await prisma.ioTSensor.findUnique({
      where: { id: sensorId },
      include: { device: { include: { property: true } } }
    });

    if (!sensor) return;

    // Create anomaly alert
    await prisma.sensorAlert.create({
      data: {
        sensorId,
        alertType: 'THRESHOLD_EXCEEDED',
        severity: AlertSeverity.MEDIUM,
        message: `Anomalous reading detected: ${value} (z-score: ${zScore.toFixed(2)})`,
        value,
        threshold: 0 // Anomaly detection doesn't use traditional thresholds
      }
    });

    // Publish anomaly alert
    pubSubService.publish('anomaly-alerts', JSON.stringify({
      type: 'ANOMALY_DETECTED',
      sensorId,
      deviceId: sensor.deviceId,
      propertyId: sensor.device.propertyId,
      value,
      zScore,
      timestamp: new Date()
    }));

    // Send notification for critical anomalies
    if (zScore > 5) {
      await sendNotification(
        'email',
        'alerts@propertyai.com',
        'Critical Anomaly Detected',
        `Sensor ${sensor.name} on device ${sensor.device.name} detected critical anomaly (value: ${value})`
      );
    }
  }

  // Real-time Dashboard Data
  public async getRealTimeDashboard(propertyId: string): Promise<any> {
    const sensors = await prisma.ioTSensor.findMany({
      where: {
        device: { propertyId },
        isActive: true
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            type: true,
            isOnline: true,
            lastSeen: true
          }
        },
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });

    const realTimeData = sensors.map(sensor => {
      const buffer = this.sensorBuffers.get(sensor.id) || [];
      const latestReading = sensor.readings[0];

      return {
        sensorId: sensor.id,
        sensorName: sensor.name,
        sensorType: sensor.sensorType,
        deviceName: sensor.device.name,
        deviceType: sensor.device.type,
        isOnline: sensor.device.isOnline,
        latestValue: latestReading?.value,
        latestTimestamp: latestReading?.timestamp,
        bufferSize: buffer.length,
        hasActivePipeline: this.pipelineConfigs.has(sensor.id)
      };
    });

    return {
      propertyId,
      totalSensors: sensors.length,
      activePipelines: this.pipelineConfigs.size,
      sensors: realTimeData,
      timestamp: new Date()
    };
  }

  // Performance Monitoring
  public getPipelinePerformance(): any {
    const pipelines = Array.from(this.pipelineConfigs.entries()).map(([sensorId, config]) => {
      const buffer = this.sensorBuffers.get(sensorId);
      return {
        sensorId,
        bufferSize: buffer?.length || 0,
        config,
        activeSubscriptions: this.activeSubscriptions.size
      };
    });

    return {
      totalPipelines: pipelines.length,
      totalBuffers: this.sensorBuffers.size,
      totalSubscriptions: this.activeSubscriptions.size,
      pipelines,
      memoryUsage: process.memoryUsage()
    };
  }

  // Cleanup inactive pipelines
  public cleanupInactivePipelines(maxAge: number = 3600000): number { // 1 hour default
    const now = Date.now();
    let cleaned = 0;

    for (const [pipelineId, intervalId] of this.activeSubscriptions) {
      // This is a simplified cleanup - in production you'd track last activity
      const pipelineAge = parseInt(pipelineId.split('_')[2]);
      if (now - pipelineAge > maxAge) {
        this.stopAnalyticsPipeline(pipelineId);
        cleaned++;
      }
    }

    return cleaned;
  }

  // WebSocket Integration for Real-time Updates
  public subscribeToRealTimeUpdates(clientId: string, sensorIds: string[]): void {
    // This would integrate with WebSocket service to send real-time updates to specific clients
    console.log(`Client ${clientId} subscribed to real-time updates for sensors: ${sensorIds.join(', ')}`);
  }

  public unsubscribeFromRealTimeUpdates(clientId: string): void {
    console.log(`Client ${clientId} unsubscribed from real-time updates`);
  }
}

export const realtimeAnalyticsService = new RealTimeAnalyticsService();