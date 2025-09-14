import { prisma } from '../config/database';
import { SensorReading, SensorType } from '@prisma/client';
import { sensorAnalyticsService } from './sensorAnalytics.service';
import { pubSubService } from './pubSub.service';
import { sendNotification } from './notificationService';

interface SensorDataPoint {
  sensorId: string;
  value: number;
  timestamp?: Date;
  quality?: number;
  metadata?: any;
}

interface BatchSensorData {
  deviceId: string;
  sensorReadings: SensorDataPoint[];
  timestamp?: Date;
}

interface DataIngestionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  processingTime: number;
}

class SensorDataIngestionService {
  private batchBuffer: Map<string, SensorDataPoint[]> = new Map();
  private batchTimeout: number = 30000; // 30 seconds
  private maxBatchSize: number = 100;

  // Real-time Data Ingestion
  public async ingestSensorData(dataPoint: SensorDataPoint): Promise<SensorReading> {
    const startTime = Date.now();

    try {
      // Validate sensor exists and is active
      const sensor = await prisma.ioTSensor.findUnique({
        where: { id: dataPoint.sensorId },
        include: { device: true }
      });

      if (!sensor) {
        throw new Error(`Sensor ${dataPoint.sensorId} not found`);
      }

      if (!sensor.isActive) {
        throw new Error(`Sensor ${dataPoint.sensorId} is not active`);
      }

      // Validate data point
      this.validateSensorData(sensor.sensorType, dataPoint.value);

      // Create reading record
      const reading = await prisma.sensorReading.create({
        data: {
          sensorId: dataPoint.sensorId,
          value: dataPoint.value,
          timestamp: dataPoint.timestamp || new Date(),
          quality: dataPoint.quality || 100
        }
      });

      // Process analytics asynchronously
      setImmediate(async () => {
        try {
          await sensorAnalyticsService.processSensorReading(
            dataPoint.sensorId,
            dataPoint.value,
            reading.timestamp
          );
        } catch (error) {
          console.error('Error processing analytics:', error);
        }
      });

      // Publish to real-time channels
      pubSubService.publish('sensor-data', JSON.stringify({
        type: 'SENSOR_READING',
        payload: {
          sensorId: dataPoint.sensorId,
          deviceId: sensor.deviceId,
          value: dataPoint.value,
          timestamp: reading.timestamp,
          sensorType: sensor.sensorType,
          sensorName: sensor.name
        }
      }));

      const processingTime = Date.now() - startTime;
      console.log(`Sensor data ingested: ${dataPoint.sensorId} = ${dataPoint.value} (${processingTime}ms)`);

      return reading;
    } catch (error) {
      console.error('Error ingesting sensor data:', error);
      throw error;
    }
  }

  // Batch Data Ingestion
  public async ingestBatchData(batchData: BatchSensorData): Promise<DataIngestionResult> {
    const startTime = Date.now();
    const result: DataIngestionResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      processingTime: 0
    };

    try {
      // Validate device exists
      const device = await prisma.ioTDevice.findUnique({
        where: { id: batchData.deviceId },
        include: { sensors: true }
      });

      if (!device) {
        throw new Error(`Device ${batchData.deviceId} not found`);
      }

      const sensorIds = device.sensors.map(s => s.id);
      const validReadings: SensorDataPoint[] = [];
      const invalidReadings: { data: SensorDataPoint; error: string }[] = [];

      // Validate and categorize readings
      for (const reading of batchData.sensorReadings) {
        if (!sensorIds.includes(reading.sensorId)) {
          invalidReadings.push({
            data: reading,
            error: `Sensor ${reading.sensorId} not found for device ${batchData.deviceId}`
          });
          continue;
        }

        try {
          const sensor = device.sensors.find(s => s.id === reading.sensorId);
          if (sensor) {
            this.validateSensorData(sensor.sensorType, reading.value);
            validReadings.push(reading);
          }
        } catch (error) {
          invalidReadings.push({
            data: reading,
            error: error.message
          });
        }
      }

      // Process valid readings in transaction
      if (validReadings.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const reading of validReadings) {
            await tx.sensorReading.create({
              data: {
                sensorId: reading.sensorId,
                value: reading.value,
                timestamp: reading.timestamp || batchData.timestamp || new Date(),
                quality: reading.quality || 100
              }
            });
          }
        });

        result.processed = validReadings.length;

        // Process analytics for batch
        setImmediate(async () => {
          for (const reading of validReadings) {
            try {
              await sensorAnalyticsService.processSensorReading(
                reading.sensorId,
                reading.value,
                reading.timestamp
              );
            } catch (error) {
              console.error('Error processing batch analytics:', error);
            }
          }
        });
      }

      // Record failures
      result.failed = invalidReadings.length;
      result.errors = invalidReadings.map(r => r.error);

      // Publish batch result
      pubSubService.publish('sensor-data', JSON.stringify({
        type: 'BATCH_DATA_INGESTED',
        payload: {
          deviceId: batchData.deviceId,
          processed: result.processed,
          failed: result.failed,
          timestamp: new Date()
        }
      }));

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
      console.error('Error ingesting batch data:', error);
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  // Streaming Data Ingestion (for high-frequency sensors)
  public async startDataStream(sensorId: string): Promise<string> {
    const streamId = `stream_${sensorId}_${Date.now()}`;

    // Initialize stream buffer
    this.batchBuffer.set(streamId, []);

    // Set up auto-flush timer
    setTimeout(() => {
      this.flushStreamBuffer(streamId);
    }, this.batchTimeout);

    console.log(`Started data stream for sensor ${sensorId}: ${streamId}`);
    return streamId;
  }

  public async streamDataPoint(streamId: string, dataPoint: SensorDataPoint): Promise<boolean> {
    const buffer = this.batchBuffer.get(streamId);
    if (!buffer) {
      throw new Error(`Stream ${streamId} not found`);
    }

    buffer.push(dataPoint);

    // Auto-flush if buffer is full
    if (buffer.length >= this.maxBatchSize) {
      await this.flushStreamBuffer(streamId);
      return true;
    }

    return false; // Buffer not flushed
  }

  public async endDataStream(streamId: string): Promise<DataIngestionResult> {
    const result = await this.flushStreamBuffer(streamId);
    this.batchBuffer.delete(streamId);
    console.log(`Ended data stream ${streamId}`);
    return result;
  }

  private async flushStreamBuffer(streamId: string): Promise<DataIngestionResult> {
    const buffer = this.batchBuffer.get(streamId);
    if (!buffer || buffer.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
        processingTime: 0
      };
    }

    // Group by sensor for batch processing
    const sensorGroups = buffer.reduce((groups, dataPoint) => {
      if (!groups[dataPoint.sensorId]) {
        groups[dataPoint.sensorId] = [];
      }
      groups[dataPoint.sensorId].push(dataPoint);
      return groups;
    }, {} as Record<string, SensorDataPoint[]>);

    let totalProcessed = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    // Process each sensor's data
    for (const [sensorId, readings] of Object.entries(sensorGroups)) {
      try {
        const batchData: BatchSensorData = {
          deviceId: '', // Will be determined from sensor
          sensorReadings: readings
        };

        // Get device ID from sensor
        const sensor = await prisma.ioTSensor.findUnique({
          where: { id: sensorId },
          select: { deviceId: true }
        });

        if (sensor) {
          batchData.deviceId = sensor.deviceId;
          const result = await this.ingestBatchData(batchData);
          totalProcessed += result.processed;
          totalFailed += result.failed;
          allErrors.push(...result.errors);
        } else {
          totalFailed += readings.length;
          allErrors.push(`Sensor ${sensorId} not found`);
        }
      } catch (error) {
        totalFailed += readings.length;
        allErrors.push(`Error processing sensor ${sensorId}: ${error.message}`);
      }
    }

    // Clear buffer
    buffer.length = 0;

    const result: DataIngestionResult = {
      success: totalFailed === 0,
      processed: totalProcessed,
      failed: totalFailed,
      errors: allErrors,
      processingTime: 0
    };

    console.log(`Flushed stream buffer ${streamId}: ${totalProcessed} processed, ${totalFailed} failed`);
    return result;
  }

  // Data Validation
  private validateSensorData(sensorType: SensorType, value: number): void {
    // Basic validation rules for different sensor types
    switch (sensorType) {
      case SensorType.TEMPERATURE:
        if (value < -100 || value > 200) {
          throw new Error(`Invalid temperature value: ${value}°C`);
        }
        break;

      case SensorType.HUMIDITY:
        if (value < 0 || value > 100) {
          throw new Error(`Invalid humidity value: ${value}%`);
        }
        break;

      case SensorType.PRESSURE:
        if (value < 0) {
          throw new Error(`Invalid pressure value: ${value}`);
        }
        break;

      case SensorType.VIBRATION:
        if (value < 0) {
          throw new Error(`Invalid vibration value: ${value}`);
        }
        break;

      case SensorType.ENERGY_CONSUMPTION:
        if (value < 0) {
          throw new Error(`Invalid energy consumption value: ${value}`);
        }
        break;

      case SensorType.AIR_QUALITY:
        if (value < 0 || value > 500) {
          throw new Error(`Invalid air quality value: ${value}`);
        }
        break;

      case SensorType.NOISE_LEVEL:
        if (value < 0) {
          throw new Error(`Invalid noise level value: ${value}`);
        }
        break;

      case SensorType.LIGHT_LEVEL:
        if (value < 0) {
          throw new Error(`Invalid light level value: ${value}`);
        }
        break;

      case SensorType.OCCUPANCY:
        if (value !== 0 && value !== 1) {
          throw new Error(`Invalid occupancy value: ${value} (must be 0 or 1)`);
        }
        break;

      // Add more sensor type validations as needed
    }
  }

  // Data Quality Monitoring
  public async monitorDataQuality(sensorId: string): Promise<any> {
    const sensor = await prisma.ioTSensor.findUnique({
      where: { id: sensorId },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1000
        }
      }
    });

    if (!sensor) {
      throw new Error(`Sensor ${sensorId} not found`);
    }

    const readings = sensor.readings;
    if (readings.length === 0) {
      return { quality: 0, issues: ['No readings available'] };
    }

    const issues: string[] = [];
    let qualityScore = 100;

    // Check for data gaps
    const timeGaps = this.detectDataGaps(readings);
    if (timeGaps.length > 0) {
      issues.push(`${timeGaps.length} data gaps detected`);
      qualityScore -= Math.min(timeGaps.length * 5, 30);
    }

    // Check for outliers
    const outliers = this.detectOutliers(readings.map(r => r.value));
    if (outliers.length > 0) {
      issues.push(`${outliers.length} outlier readings detected`);
      qualityScore -= Math.min(outliers.length * 2, 20);
    }

    // Check for stuck values
    const stuckPeriods = this.detectStuckValues(readings);
    if (stuckPeriods.length > 0) {
      issues.push(`${stuckPeriods.length} stuck value periods detected`);
      qualityScore -= Math.min(stuckPeriods.length * 10, 30);
    }

    // Check average quality score
    const avgQuality = readings.reduce((sum, r) => sum + r.quality, 0) / readings.length;
    if (avgQuality < 80) {
      issues.push(`Low average quality score: ${avgQuality.toFixed(1)}%`);
      qualityScore -= (100 - avgQuality) * 0.5;
    }

    return {
      sensorId,
      qualityScore: Math.max(0, Math.round(qualityScore)),
      issues,
      metrics: {
        totalReadings: readings.length,
        averageQuality: Math.round(avgQuality),
        dataGaps: timeGaps.length,
        outliers: outliers.length,
        stuckPeriods: stuckPeriods.length
      }
    };
  }

  private detectDataGaps(readings: any[]): any[] {
    if (readings.length < 2) return [];

    const gaps = [];
    const sortedReadings = readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 1; i < sortedReadings.length; i++) {
      const timeDiff = sortedReadings[i].timestamp.getTime() - sortedReadings[i-1].timestamp.getTime();
      // Assume readings should be every 5 minutes (300000ms)
      if (timeDiff > 600000) { // 10 minutes gap
        gaps.push({
          start: sortedReadings[i-1].timestamp,
          end: sortedReadings[i].timestamp,
          duration: timeDiff
        });
      }
    }

    return gaps;
  }

  private detectOutliers(values: number[]): number[] {
    if (values.length < 10) return [];

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    return values.filter(val => Math.abs(val - mean) > 3 * stdDev);
  }

  private detectStuckValues(readings: any[]): any[] {
    if (readings.length < 5) return [];

    const stuckPeriods = [];
    let currentStuckStart = null;
    let lastValue = null;

    for (const reading of readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())) {
      if (lastValue !== null && reading.value === lastValue) {
        if (currentStuckStart === null) {
          currentStuckStart = reading.timestamp;
        }
      } else {
        if (currentStuckStart !== null) {
          const duration = reading.timestamp.getTime() - currentStuckStart.getTime();
          if (duration > 1800000) { // 30 minutes
            stuckPeriods.push({
              start: currentStuckStart,
              end: reading.timestamp,
              value: lastValue,
              duration
            });
          }
          currentStuckStart = null;
        }
      }
      lastValue = reading.value;
    }

    return stuckPeriods;
  }

  // Data Compression for Long-term Storage
  public async compressHistoricalData(sensorId: string, startDate: Date, endDate: Date): Promise<any> {
    const readings = await prisma.sensorReading.findMany({
      where: {
        sensorId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (readings.length === 0) return { compressed: 0, original: 0 };

    // Simple compression: keep hourly averages for data older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (startDate >= thirtyDaysAgo) {
      return { compressed: 0, original: readings.length, message: 'Data too recent for compression' };
    }

    // Group by hour and calculate averages
    const hourlyData = new Map<string, { values: number[], qualities: number[] }>();

    for (const reading of readings) {
      const hourKey = reading.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      if (!hourlyData.has(hourKey)) {
        hourlyData.set(hourKey, { values: [], qualities: [] });
      }
      const data = hourlyData.get(hourKey)!;
      data.values.push(reading.value);
      data.qualities.push(reading.quality);
    }

    // Create compressed readings
    const compressedReadings = [];
    for (const [hourKey, data] of hourlyData) {
      const avgValue = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
      const avgQuality = data.qualities.reduce((sum, val) => sum + val, 0) / data.qualities.length;

      compressedReadings.push({
        sensorId,
        value: avgValue,
        timestamp: new Date(hourKey + ':00:00.000Z'),
        quality: Math.round(avgQuality),
        metadata: { compressed: true, originalCount: data.values.length }
      });
    }

    // Replace original readings with compressed ones
    await prisma.$transaction(async (tx) => {
      // Delete original readings
      await tx.sensorReading.deleteMany({
        where: {
          sensorId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Insert compressed readings
      for (const reading of compressedReadings) {
        await tx.sensorReading.create({ data: reading });
      }
    });

    return {
      compressed: compressedReadings.length,
      original: readings.length,
      compressionRatio: (readings.length / compressedReadings.length).toFixed(2)
    };
  }

  // Real-time Alert Processing
  public async processRealTimeAlerts(): Promise<void> {
    await sensorAnalyticsService.processRealTimeAlerts();
  }
}

export const sensorDataIngestionService = new SensorDataIngestionService();