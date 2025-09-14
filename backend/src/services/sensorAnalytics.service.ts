import { prisma } from '../config/database';
import { SensorReading, SensorAlert, AnalyticsRule, SensorType, AlertSeverity } from '@prisma/client';
import { pubSubService } from './pubSub.service';
import { sendNotification } from './notificationService';

interface AnalyticsResult {
  sensorId: string;
  metric: string;
  value: number;
  timestamp: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  anomaly: boolean;
}

interface PredictiveMaintenanceResult {
  deviceId: string;
  sensorId: string;
  prediction: string;
  confidence: number;
  recommendedAction: string;
  estimatedTimeToFailure?: number; // hours
  timestamp: Date;
}

class SensorAnalyticsService {
  // Real-time Analytics
  public async processSensorReading(sensorId: string, value: number, timestamp: Date = new Date()): Promise<AnalyticsResult[]> {
    const results: AnalyticsResult[] = [];

    // Get sensor details
    const sensor = await prisma.ioTSensor.findUnique({
      where: { id: sensorId },
      include: { device: true }
    });

    if (!sensor) return results;

    // Calculate basic metrics
    const basicMetrics = await this.calculateBasicMetrics(sensorId, value, timestamp);
    results.push(...basicMetrics);

    // Detect anomalies
    const anomalyResult = await this.detectAnomaly(sensorId, value, timestamp);
    if (anomalyResult) results.push(anomalyResult);

    // Calculate trends
    const trendResult = await this.calculateTrend(sensorId, timestamp);
    if (trendResult) results.push(trendResult);

    // Publish analytics results
    pubSubService.publish('sensor-analytics', JSON.stringify({
      type: 'ANALYTICS_RESULTS',
      sensorId,
      results
    }));

    return results;
  }

  private async calculateBasicMetrics(sensorId: string, currentValue: number, timestamp: Date): Promise<AnalyticsResult[]> {
    const results: AnalyticsResult[] = [];

    // Get recent readings for calculations
    const recentReadings = await prisma.sensorReading.findMany({
      where: { sensorId },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    if (recentReadings.length === 0) return results;

    // Calculate moving average
    const values = recentReadings.map(r => r.value);
    const movingAverage = values.reduce((sum, val) => sum + val, 0) / values.length;

    results.push({
      sensorId,
      metric: 'moving_average',
      value: movingAverage,
      timestamp,
      trend: 'stable',
      anomaly: false
    });

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - movingAverage, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    results.push({
      sensorId,
      metric: 'standard_deviation',
      value: standardDeviation,
      timestamp,
      trend: 'stable',
      anomaly: false
    });

    // Calculate min/max over last hour
    const oneHourAgo = new Date(timestamp.getTime() - 60 * 60 * 1000);
    const hourlyReadings = recentReadings.filter(r => r.timestamp >= oneHourAgo);

    if (hourlyReadings.length > 0) {
      const hourlyValues = hourlyReadings.map(r => r.value);
      const min = Math.min(...hourlyValues);
      const max = Math.max(...hourlyValues);

      results.push({
        sensorId,
        metric: 'hourly_min',
        value: min,
        timestamp,
        trend: 'stable',
        anomaly: false
      });

      results.push({
        sensorId,
        metric: 'hourly_max',
        value: max,
        timestamp,
        trend: 'stable',
        anomaly: false
      });
    }

    return results;
  }

  private async detectAnomaly(sensorId: string, value: number, timestamp: Date): Promise<AnalyticsResult | null> {
    // Get historical data for anomaly detection
    const historicalReadings = await prisma.sensorReading.findMany({
      where: { sensorId },
      orderBy: { timestamp: 'desc' },
      take: 1000 // Use more data for better anomaly detection
    });

    if (historicalReadings.length < 50) return null; // Need minimum data for anomaly detection

    const values = historicalReadings.map(r => r.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Simple z-score based anomaly detection
    const zScore = Math.abs((value - mean) / stdDev);

    // Consider it an anomaly if z-score > 3 (99.7% confidence)
    const isAnomaly = zScore > 3;

    return {
      sensorId,
      metric: 'anomaly_score',
      value: zScore,
      timestamp,
      trend: 'stable',
      anomaly: isAnomaly
    };
  }

  private async calculateTrend(sensorId: string, timestamp: Date): Promise<AnalyticsResult | null> {
    // Get readings from last 24 hours
    const twentyFourHoursAgo = new Date(timestamp.getTime() - 24 * 60 * 60 * 1000);

    const readings = await prisma.sensorReading.findMany({
      where: {
        sensorId,
        timestamp: { gte: twentyFourHoursAgo }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (readings.length < 10) return null;

    // Simple linear regression for trend
    const n = readings.length;
    const sumX = readings.reduce((sum, _, index) => sum + index, 0);
    const sumY = readings.reduce((sum, r) => sum + r.value, 0);
    const sumXY = readings.reduce((sum, r, index) => sum + index * r.value, 0);
    const sumXX = readings.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (slope > 0.01) trend = 'increasing';
    else if (slope < -0.01) trend = 'decreasing';

    return {
      sensorId,
      metric: 'trend_slope',
      value: slope,
      timestamp,
      trend,
      anomaly: false
    };
  }

  // Predictive Maintenance
  public async performPredictiveMaintenance(sensorId: string): Promise<PredictiveMaintenanceResult[]> {
    const results: PredictiveMaintenanceResult[] = [];

    const sensor = await prisma.ioTSensor.findUnique({
      where: { id: sensorId },
      include: {
        device: true,
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1000
        },
        alerts: {
          where: { resolved: false },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!sensor || sensor.readings.length < 100) return results;

    // Analyze different sensor types
    switch (sensor.sensorType) {
      case SensorType.TEMPERATURE:
        results.push(...await this.analyzeTemperatureSensor(sensor));
        break;
      case SensorType.VIBRATION:
        results.push(...await this.analyzeVibrationSensor(sensor));
        break;
      case SensorType.ENERGY_CONSUMPTION:
        results.push(...await this.analyzeEnergySensor(sensor));
        break;
      case SensorType.PRESSURE:
        results.push(...await this.analyzePressureSensor(sensor));
        break;
    }

    // Publish predictive maintenance results
    pubSubService.publish('predictive-maintenance', JSON.stringify({
      type: 'PREDICTIVE_RESULTS',
      sensorId,
      results
    }));

    return results;
  }

  private async analyzeTemperatureSensor(sensor: any): Promise<PredictiveMaintenanceResult[]> {
    const results: PredictiveMaintenanceResult[] = [];
    const readings = sensor.readings.map(r => r.value);

    // Check for overheating patterns
    const avgTemp = readings.reduce((sum, val) => sum + val, 0) / readings.length;
    const maxTemp = Math.max(...readings);

    if (maxTemp > 80) { // Assuming Celsius
      results.push({
        deviceId: sensor.deviceId,
        sensorId: sensor.id,
        prediction: 'Overheating detected',
        confidence: 0.85,
        recommendedAction: 'Check cooling system and ventilation',
        estimatedTimeToFailure: maxTemp > 90 ? 24 : 168, // 1 day or 1 week
        timestamp: new Date()
      });
    }

    // Check for temperature fluctuations
    const tempVariance = this.calculateVariance(readings);
    if (tempVariance > 10) {
      results.push({
        deviceId: sensor.deviceId,
        sensorId: sensor.id,
        prediction: 'Unstable temperature control',
        confidence: 0.75,
        recommendedAction: 'Inspect thermostat and HVAC system',
        estimatedTimeToFailure: 336, // 2 weeks
        timestamp: new Date()
      });
    }

    return results;
  }

  private async analyzeVibrationSensor(sensor: any): Promise<PredictiveMaintenanceResult[]> {
    const results: PredictiveMaintenanceResult[] = [];
    const readings = sensor.readings.map(r => r.value);

    // Check for increasing vibration patterns
    const recentReadings = readings.slice(0, 50); // Last 50 readings
    const olderReadings = readings.slice(50, 100); // Previous 50 readings

    if (recentReadings.length >= 10 && olderReadings.length >= 10) {
      const recentAvg = recentReadings.reduce((sum, val) => sum + val, 0) / recentReadings.length;
      const olderAvg = olderReadings.reduce((sum, val) => sum + val, 0) / olderReadings.length;

      const increase = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (increase > 20) {
        results.push({
          deviceId: sensor.deviceId,
          sensorId: sensor.id,
          prediction: 'Increasing vibration detected',
          confidence: 0.80,
          recommendedAction: 'Schedule maintenance inspection for bearings/motors',
          estimatedTimeToFailure: increase > 50 ? 72 : 168, // 3 days or 1 week
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  private async analyzeEnergySensor(sensor: any): Promise<PredictiveMaintenanceResult[]> {
    const results: PredictiveMaintenanceResult[] = [];
    const readings = sensor.readings.map(r => r.value);

    // Check for energy consumption patterns
    const avgConsumption = readings.reduce((sum, val) => sum + val, 0) / readings.length;

    // Compare with baseline (this would be learned over time)
    const baselineConsumption = avgConsumption * 0.8; // Assume 80% of average is baseline

    if (avgConsumption > baselineConsumption * 1.5) {
      results.push({
        deviceId: sensor.deviceId,
        sensorId: sensor.id,
        prediction: 'Abnormal energy consumption',
        confidence: 0.70,
        recommendedAction: 'Check for energy leaks or inefficient operation',
        estimatedTimeToFailure: 720, // 30 days
        timestamp: new Date()
      });
    }

    return results;
  }

  private async analyzePressureSensor(sensor: any): Promise<PredictiveMaintenanceResult[]> {
    const results: PredictiveMaintenanceResult[] = [];
    const readings = sensor.readings.map(r => r.value);

    // Check for pressure fluctuations
    const pressureVariance = this.calculateVariance(readings);

    if (pressureVariance > 5) {
      results.push({
        deviceId: sensor.deviceId,
        sensorId: sensor.id,
        prediction: 'Pressure system instability',
        confidence: 0.75,
        recommendedAction: 'Inspect pressure regulators and valves',
        estimatedTimeToFailure: 168, // 1 week
        timestamp: new Date()
      });
    }

    return results;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  // Analytics Dashboard Data
  public async getAnalyticsDashboard(propertyId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get sensor summary
    const sensors = await prisma.ioTSensor.findMany({
      where: {
        device: {
          propertyId
        },
        isActive: true
      },
      include: {
        readings: {
          where: { timestamp: { gte: startDate } },
          orderBy: { timestamp: 'desc' }
        },
        alerts: {
          where: {
            timestamp: { gte: startDate },
            resolved: false
          }
        }
      }
    });

    // Calculate metrics
    const totalSensors = sensors.length;
    const activeSensors = sensors.filter(s => s.readings.length > 0).length;
    const sensorsWithAlerts = sensors.filter(s => s.alerts.length > 0).length;
    const totalReadings = sensors.reduce((sum, s) => sum + s.readings.length, 0);
    const totalAlerts = sensors.reduce((sum, s) => sum + s.alerts.length, 0);

    // Get sensor type breakdown
    const sensorTypeBreakdown = sensors.reduce((acc, sensor) => {
      acc[sensor.sensorType] = (acc[sensor.sensorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent alerts
    const recentAlerts = await prisma.sensorAlert.findMany({
      where: {
        sensor: {
          device: { propertyId }
        },
        timestamp: { gte: startDate }
      },
      include: {
        sensor: {
          include: {
            device: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    return {
      summary: {
        totalSensors,
        activeSensors,
        sensorsWithAlerts,
        totalReadings,
        totalAlerts,
        uptime: activeSensors / totalSensors * 100
      },
      sensorTypeBreakdown,
      recentAlerts: recentAlerts.map(alert => ({
        id: alert.id,
        sensorName: alert.sensor.name,
        deviceName: alert.sensor.device.name,
        type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        acknowledged: alert.acknowledged
      })),
      timeRange
    };
  }

  // Historical Data Analysis
  public async getHistoricalAnalysis(sensorId: string, startDate: Date, endDate: Date): Promise<any> {
    const readings = await prisma.sensorReading.findMany({
      where: {
        sensorId,
        timestamp: { gte: startDate, lte: endDate }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (readings.length === 0) return null;

    const values = readings.map(r => r.value);

    // Calculate statistical metrics
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = this.calculateMedian(values);
    const variance = this.calculateVariance(values);
    const stdDev = Math.sqrt(variance);

    // Calculate percentiles
    const percentiles = {
      p25: this.calculatePercentile(values, 25),
      p50: median,
      p75: this.calculatePercentile(values, 75),
      p95: this.calculatePercentile(values, 95)
    };

    // Detect trends
    const trend = this.calculateTrendFromValues(values);

    return {
      sensorId,
      period: { startDate, endDate },
      count: readings.length,
      statistics: {
        min,
        max,
        mean,
        median,
        standardDeviation: stdDev,
        variance
      },
      percentiles,
      trend,
      dataPoints: readings.map(r => ({
        timestamp: r.timestamp,
        value: r.value,
        quality: r.quality
      }))
    };
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) return sorted[lower];

    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
  }

  private calculateTrendFromValues(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 10) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  // Export Analytics Data
  public async exportAnalyticsData(sensorId: string, format: 'json' | 'csv', startDate: Date, endDate: Date): Promise<string> {
    const readings = await prisma.sensorReading.findMany({
      where: {
        sensorId,
        timestamp: { gte: startDate, lte: endDate }
      },
      orderBy: { timestamp: 'asc' },
      include: {
        sensor: {
          include: {
            device: true
          }
        }
      }
    });

    if (format === 'json') {
      return JSON.stringify(readings, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'value', 'quality', 'sensor_name', 'device_name'];
      const rows = readings.map(reading => [
        reading.timestamp.toISOString(),
        reading.value.toString(),
        reading.quality.toString(),
        reading.sensor.name,
        reading.sensor.device.name
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  }

  // Real-time Alert Processing
  public async processRealTimeAlerts(): Promise<void> {
    const unprocessedAlerts = await prisma.sensorAlert.findMany({
      where: {
        acknowledged: false,
        resolved: false
      },
      include: {
        sensor: {
          include: {
            device: {
              include: {
                property: true
              }
            }
          }
        }
      }
    });

    for (const alert of unprocessedAlerts) {
      // Send notifications for high/critical alerts
      if (alert.severity === AlertSeverity.HIGH || alert.severity === AlertSeverity.CRITICAL) {
        await sendNotification(
          'email',
          'admin@propertyai.com',
          `IoT Alert: ${alert.alertType}`,
          `Alert from ${alert.sensor.device.name}: ${alert.message}`
        );
      }

      // Publish to real-time channels
      pubSubService.publish('alerts', JSON.stringify({
        type: 'NEW_ALERT',
        alert: {
          id: alert.id,
          sensorName: alert.sensor.name,
          deviceName: alert.sensor.device.name,
          propertyName: alert.sensor.device.property.title,
          type: alert.alertType,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp
        }
      }));
    }
  }
}

export const sensorAnalyticsService = new SensorAnalyticsService();