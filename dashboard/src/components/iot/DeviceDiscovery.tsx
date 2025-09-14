import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Wifi as WifiIcon,
  Bluetooth as BluetoothIcon,
  Router as RouterIcon,
  SettingsRemote as RemoteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DeviceType, ProtocolType } from '../../../types/iot';

interface DiscoveredDevice {
  id: string;
  name: string;
  type: DeviceType;
  protocol: ProtocolType;
  macAddress?: string;
  ipAddress?: string;
  signalStrength?: number;
  capabilities?: any;
  metadata?: any;
}

interface DeviceDiscoveryProps {
  propertyId: string;
  onDeviceDiscovered?: (device: DiscoveredDevice) => void;
  onDeviceRegistered?: (device: any) => void;
}

const DeviceDiscovery: React.FC<DeviceDiscoveryProps> = ({
  propertyId,
  onDeviceDiscovered,
  onDeviceRegistered
}) => {
  const theme = useTheme();
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType | 'all'>('all');
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [registerDialog, setRegisterDialog] = useState<{
    open: boolean;
    device?: DiscoveredDevice;
  }>({ open: false });

  const protocols: ProtocolType[] = [
    ProtocolType.MQTT,
    ProtocolType.ZIGBEE,
    ProtocolType.ZWAVE,
    ProtocolType.WIFI,
    ProtocolType.BLUETOOTH_LE,
    ProtocolType.THREAD
  ];

  const getProtocolIcon = (protocol: ProtocolType) => {
    switch (protocol) {
      case ProtocolType.WIFI:
        return <WifiIcon />;
      case ProtocolType.BLUETOOTH_LE:
        return <BluetoothIcon />;
      case ProtocolType.ZIGBEE:
      case ProtocolType.ZWAVE:
      case ProtocolType.THREAD:
        return <RouterIcon />;
      default:
        return <RemoteIcon />;
    }
  };

  const getDeviceTypeColor = (type: DeviceType) => {
    switch (type) {
      case DeviceType.SECURITY_CAMERA:
      case DeviceType.SMART_LOCK:
        return theme.palette.error.main;
      case DeviceType.SMART_THERMOSTAT:
      case DeviceType.HVAC_CONTROLLER:
        return theme.palette.warning.main;
      case DeviceType.SMART_LIGHT:
        return theme.palette.success.main;
      case DeviceType.MOTION_SENSOR:
      case DeviceType.DOOR_SENSOR:
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const handleDiscovery = async () => {
    setIsDiscovering(true);
    setError(null);
    setDiscoveryResults(null);

    try {
      const protocolsToScan = selectedProtocol === 'all' ? protocols : [selectedProtocol];

      const response = await fetch(`/api/iot/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          propertyId,
          protocols: protocolsToScan
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start device discovery');
      }

      const results = await response.json();
      setDiscoveryResults(results);

      // Process discovered devices
      const allDevices: DiscoveredDevice[] = [];
      for (const [protocol, devices] of Object.entries(results)) {
        (devices as any[]).forEach(device => {
          allDevices.push({
            ...device,
            protocol: protocol as ProtocolType
          });
        });
      }

      setDiscoveredDevices(allDevices);

      // Notify parent component
      allDevices.forEach(device => {
        onDeviceDiscovered?.(device);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRegisterDevice = async (device: DiscoveredDevice) => {
    try {
      const response = await fetch(`/api/iot/properties/${propertyId}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: device.name,
          type: device.type,
          protocol: device.protocol,
          deviceId: device.id,
          macAddress: device.macAddress,
          ipAddress: device.ipAddress,
          capabilities: device.capabilities,
          metadata: device.metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register device');
      }

      const registeredDevice = await response.json();
      onDeviceRegistered?.(registeredDevice);

      // Remove from discovered devices
      setDiscoveredDevices(prev => prev.filter(d => d.id !== device.id));

      setRegisterDialog({ open: false });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const getSignalStrengthColor = (strength?: number) => {
    if (!strength) return theme.palette.grey[400];
    if (strength > 75) return theme.palette.success.main;
    if (strength > 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Device Discovery
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={isDiscovering ? <CircularProgress size={20} /> : <SearchIcon />}
              onClick={handleDiscovery}
              disabled={isDiscovering}
              fullWidth
            >
              {isDiscovering ? 'Discovering...' : 'Start Discovery'}
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setSelectedProtocol('all')}
              disabled={isDiscovering}
              fullWidth
            >
              All Protocols
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {protocols.map(protocol => (
                <Chip
                  key={protocol}
                  icon={getProtocolIcon(protocol)}
                  label={protocol}
                  onClick={() => setSelectedProtocol(protocol)}
                  color={selectedProtocol === protocol ? 'primary' : 'default'}
                  variant={selectedProtocol === protocol ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {discoveryResults && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Discovery Results:
            </Typography>
            {Object.entries(discoveryResults).map(([protocol, devices]) => (
              <Chip
                key={protocol}
                label={`${protocol}: ${(devices as any[]).length} devices`}
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}
      </Paper>

      {discoveredDevices.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Discovered Devices ({discoveredDevices.length})
          </Typography>

          <List>
            {discoveredDevices.map((device, index) => (
              <React.Fragment key={device.id}>
                <ListItem
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemIcon>
                    {getProtocolIcon(device.protocol)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">{device.name}</Typography>
                        <Chip
                          label={device.type}
                          size="small"
                          sx={{
                            backgroundColor: getDeviceTypeColor(device.type),
                            color: 'white'
                          }}
                        />
                        <Chip
                          label={device.protocol}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          ID: {device.id}
                        </Typography>
                        {device.ipAddress && (
                          <Typography variant="body2" color="text.secondary">
                            IP: {device.ipAddress}
                          </Typography>
                        )}
                        {device.macAddress && (
                          <Typography variant="body2" color="text.secondary">
                            MAC: {device.macAddress}
                          </Typography>
                        )}
                        {device.signalStrength && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="text.secondary">
                              Signal:
                            </Typography>
                            <Box
                              sx={{
                                width: 60,
                                height: 4,
                                backgroundColor: theme.palette.grey[300],
                                borderRadius: 2
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${device.signalStrength}%`,
                                  height: '100%',
                                  backgroundColor: getSignalStrengthColor(device.signalStrength),
                                  borderRadius: 2
                                }}
                              />
                            </Box>
                            <Typography variant="body2">
                              {device.signalStrength}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />

                  <Box display="flex" gap={1}>
                    <Tooltip title="Register Device">
                      <IconButton
                        color="primary"
                        onClick={() => setRegisterDialog({ open: true, device })}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>

                {index < discoveredDevices.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Register Device Dialog */}
      <Dialog
        open={registerDialog.open}
        onClose={() => setRegisterDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Register Device</DialogTitle>
        <DialogContent>
          {registerDialog.device && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {registerDialog.device.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: {registerDialog.device.type}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Protocol: {registerDialog.device.protocol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {registerDialog.device.id}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={() => registerDialog.device && handleRegisterDevice(registerDialog.device)}
            variant="contained"
            startIcon={<CheckCircleIcon />}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceDiscovery;