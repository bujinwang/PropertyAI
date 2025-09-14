import { Router } from 'express';
import { iotDeviceService } from '../services/iotDevice.service';
import { iotProtocolAdaptersService } from '../services/iotProtocolAdapters.service';
import { sensorAnalyticsService } from '../services/sensorAnalytics.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

// Apply authentication to all IoT routes
router.use(authenticateToken);

// Device Management Routes

// Get all devices for a property
router.get('/properties/:propertyId/devices', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const devices = await iotDeviceService.getDevicesByProperty(propertyId);
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get device by ID
router.get('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await iotDeviceService.getDeviceById(deviceId);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Register new device
router.post('/properties/:propertyId/devices', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const deviceData = req.body;

    const device = await iotDeviceService.registerDevice(propertyId, deviceData);
    res.status(201).json(device);
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// Update device
router.put('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const updateData = req.body;

    // Note: This would need to be implemented in the service
    res.json({ message: 'Device update not implemented yet' });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Update device status
router.patch('/devices/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isOnline, batteryLevel, signalStrength } = req.body;

    const device = await iotDeviceService.updateDeviceStatus(deviceId, isOnline, batteryLevel, signalStrength);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({ error: 'Failed to update device status' });
  }
});

// Update device firmware
router.patch('/devices/:deviceId/firmware', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { firmwareVersion } = req.body;

    const device = await iotDeviceService.updateDeviceFirmware(deviceId, firmwareVersion);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error updating firmware:', error);
    res.status(500).json({ error: 'Failed to update firmware' });
  }
});

// Delete device
router.delete('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    // Note: This would need to be implemented in the service
    res.json({ message: 'Device deletion not implemented yet' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Device Discovery Routes

// Discover devices
router.post('/discover', async (req, res) => {
  try {
    const { propertyId, protocols } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    let results;

    if (protocols && Array.isArray(protocols)) {
      // Discover on specific protocols
      results = {};
      for (const protocol of protocols) {
        try {
          const devices = await iotProtocolAdaptersService.discoverDevices(protocol);
          results[protocol] = devices;
        } catch (error) {
          console.error(`Error discovering devices on ${protocol}:`, error);
          results[protocol] = [];
        }
      }
    } else {
      // Discover on all protocols
      results = await iotProtocolAdaptersService.discoverAllDevices();
    }

    res.json(results);
  } catch (error) {
    console.error('Error during device discovery:', error);
    res.status(500).json({ error: 'Failed to discover devices' });
  }
});

// Device Groups Routes

// Create device group
router.post('/properties/:propertyId/groups', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { name, description } = req.body;

    const group = await iotDeviceService.createDeviceGroup(propertyId, name, description);
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating device group:', error);
    res.status(500).json({ error: 'Failed to create device group' });
  }
});

// Add device to group
router.post('/groups/:groupId/devices/:deviceId', async (req, res) => {
  try {
    const { groupId, deviceId } = req.params;

    const device = await iotDeviceService.addDeviceToGroup(deviceId, groupId);

    if (!device) {
      return res.status(404).json({ error: 'Device or group not found' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error adding device to group:', error);
    res.status(500).json({ error: 'Failed to add device to group' });
  }
});

// Sensor Management Routes

// Create sensor for device
router.post('/devices/:deviceId/sensors', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const sensorData = req.body;

    const sensor = await iotDeviceService.createSensor(deviceId, sensorData);
    res.status(201).json(sensor);
  } catch (error) {
    console.error('Error creating sensor:', error);
    res.status(500).json({ error: 'Failed to create sensor' });
  }
});

// Record sensor reading
router.post('/sensors/:sensorId/readings', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { value, timestamp, quality } = req.body;

    const reading = await iotDeviceService.recordSensorReading(sensorId, value, timestamp ? new Date(timestamp) : undefined, quality);

    // Process analytics
    await sensorAnalyticsService.processSensorReading(sensorId, value, reading.timestamp);

    res.status(201).json(reading);
  } catch (error) {
    console.error('Error recording sensor reading:', error);
    res.status(500).json({ error: 'Failed to record sensor reading' });
  }
});

// Get sensor readings
router.get('/sensors/:sensorId/readings', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    const readings = await iotDeviceService.getSensorReadings(
      sensorId,
      parseInt(limit as string),
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(readings);
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    res.status(500).json({ error: 'Failed to fetch sensor readings' });
  }
});

// Alert Management Routes

// Get alerts for property
router.get('/properties/:propertyId/alerts', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { acknowledged, resolved, limit = 50 } = req.query;

    // This would need to be implemented in the service
    res.json({ message: 'Alert fetching not implemented yet' });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge alert
router.patch('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    const alert = await iotDeviceService.acknowledgeAlert(alertId, userId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve alert
router.patch('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await iotDeviceService.resolveAlert(alertId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Analytics Routes

// Get analytics dashboard
router.get('/properties/:propertyId/analytics', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { timeRange = '24h' } = req.query;

    const analytics = await sensorAnalyticsService.getAnalyticsDashboard(
      propertyId,
      timeRange as '1h' | '24h' | '7d' | '30d'
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get historical analysis for sensor
router.get('/sensors/:sensorId/analytics/historical', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const analysis = await sensorAnalyticsService.getHistoricalAnalysis(
      sensorId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    if (!analysis) {
      return res.status(404).json({ error: 'No data found for the specified period' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching historical analysis:', error);
    res.status(500).json({ error: 'Failed to fetch historical analysis' });
  }
});

// Export analytics data
router.get('/sensors/:sensorId/export', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const data = await sensorAnalyticsService.exportAnalyticsData(
      sensorId,
      format as 'json' | 'csv',
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const extension = format === 'json' ? 'json' : 'csv';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=sensor-${sensorId}-data.${extension}`);

    res.send(data);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

// Predictive Maintenance Routes

// Get predictive maintenance for sensor
router.get('/sensors/:sensorId/predictive', async (req, res) => {
  try {
    const { sensorId } = req.params;

    const predictions = await sensorAnalyticsService.performPredictiveMaintenance(sensorId);
    res.json(predictions);
  } catch (error) {
    console.error('Error fetching predictive maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch predictive maintenance' });
  }
});

// Analytics Rules Routes

// Create analytics rule
router.post('/properties/:propertyId/analytics-rules', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const ruleData = req.body;

    const rule = await iotDeviceService.createAnalyticsRule(propertyId, ruleData);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating analytics rule:', error);
    res.status(500).json({ error: 'Failed to create analytics rule' });
  }
});

// Protocol Adapter Routes

// Get supported protocols
router.get('/protocols', async (req, res) => {
  try {
    const protocols = iotProtocolAdaptersService.getSupportedProtocols();
    res.json({ protocols });
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ error: 'Failed to fetch protocols' });
  }
});

// Send command to device
router.post('/devices/:deviceId/command', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, parameters } = req.body;

    const result = await iotDeviceService.sendDeviceCommand({
      deviceId,
      command,
      parameters
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending device command:', error);
    res.status(500).json({ error: 'Failed to send device command' });
  }
});

// Device Health Routes

// Get device health report
router.get('/properties/:propertyId/health', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const healthReport = await iotDeviceService.getDeviceHealthReport(propertyId);
    res.json(healthReport);
  } catch (error) {
    console.error('Error fetching health report:', error);
    res.status(500).json({ error: 'Failed to fetch health report' });
  }
});

// Bulk Operations Routes

// Bulk update device status
router.patch('/devices/bulk/status', async (req, res) => {
  try {
    const { deviceIds, isOnline } = req.body;

    if (!deviceIds || !Array.isArray(deviceIds)) {
      return res.status(400).json({ error: 'deviceIds array is required' });
    }

    await iotDeviceService.bulkUpdateDeviceStatus(deviceIds, isOnline);
    res.json({ message: 'Bulk status update completed' });
  } catch (error) {
    console.error('Error performing bulk status update:', error);
    res.status(500).json({ error: 'Failed to perform bulk status update' });
  }
});

// Get devices by type
router.get('/properties/:propertyId/devices/type/:deviceType', async (req, res) => {
  try {
    const { propertyId, deviceType } = req.params;

    const devices = await iotDeviceService.getDevicesByType(propertyId, deviceType as any);
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices by type:', error);
    res.status(500).json({ error: 'Failed to fetch devices by type' });
  }
});

// Get offline devices
router.get('/properties/:propertyId/devices/offline', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { minutesOffline = 30 } = req.query;

    const devices = await iotDeviceService.getOfflineDevices(propertyId, parseInt(minutesOffline as string));
    res.json(devices);
  } catch (error) {
    console.error('Error fetching offline devices:', error);
    res.status(500).json({ error: 'Failed to fetch offline devices' });
  }
});

export default router;