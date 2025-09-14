import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Power as PowerIcon,
  PowerOff as PowerOffIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  Bluetooth as BluetoothIcon,
  Router as RouterIcon,
  SettingsRemote as RemoteIcon,
  BatteryFull as BatteryFullIcon,
  Battery50 as Battery50Icon,
  Battery20 as Battery20Icon,
  BatteryAlert as BatteryAlertIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DeviceType, ProtocolType, IoTDevice } from '../../../types/iot';

interface DeviceListProps {
  propertyId: string;
  onDeviceSelected?: (device: IoTDevice) => void;
  onDeviceUpdated?: (device: IoTDevice) => void;
  refreshTrigger?: number;
}

const DeviceList: React.FC<DeviceListProps> = ({
  propertyId,
  onDeviceSelected,
  onDeviceUpdated,
  refreshTrigger
}) => {
  const theme = useTheme();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    device?: IoTDevice;
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    device?: IoTDevice;
  }>({ open: false });
  const [commandDialog, setCommandDialog] = useState<{
    open: boolean;
    device?: IoTDevice;
  }>({ open: false });
  const [commandForm, setCommandForm] = useState({
    command: '',
    parameters: ''
  });

  useEffect(() => {
    fetchDevices();
  }, [propertyId, refreshTrigger]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/iot/properties/${propertyId}/devices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

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

  const getBatteryIcon = (level?: number) => {
    if (!level) return null;
    if (level > 75) return <BatteryFullIcon color="success" />;
    if (level > 50) return <Battery50Icon color="warning" />;
    if (level > 20) return <Battery20Icon color="warning" />;
    return <BatteryAlertIcon color="error" />;
  };

  const getStatusColor = (isOnline: boolean, lastSeen?: Date) => {
    if (!isOnline) return theme.palette.grey[500];

    if (lastSeen) {
      const minutesSinceLastSeen = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60);
      if (minutesSinceLastSeen > 30) return theme.palette.warning.main;
      if (minutesSinceLastSeen > 5) return theme.palette.info.main;
    }

    return theme.palette.success.main;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, device: IoTDevice) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDevice(device);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDevice(null);
  };

  const handleEditDevice = () => {
    if (selectedDevice) {
      setEditDialog({ open: true, device: selectedDevice });
    }
    handleMenuClose();
  };

  const handleDeleteDevice = () => {
    if (selectedDevice) {
      setDeleteDialog({ open: true, device: selectedDevice });
    }
    handleMenuClose();
  };

  const handleSendCommand = () => {
    if (selectedDevice) {
      setCommandDialog({ open: true, device: selectedDevice });
      setCommandForm({ command: '', parameters: '' });
    }
    handleMenuClose();
  };

  const handleUpdateDevice = async (updatedDevice: Partial<IoTDevice>) => {
    if (!editDialog.device) return;

    try {
      const response = await fetch(`/api/iot/devices/${editDialog.device.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedDevice)
      });

      if (!response.ok) {
        throw new Error('Failed to update device');
      }

      const device = await response.json();
      setDevices(prev => prev.map(d => d.id === device.id ? device : d));
      onDeviceUpdated?.(device);
      setEditDialog({ open: false });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.device) return;

    try {
      const response = await fetch(`/api/iot/devices/${deleteDialog.device.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete device');
      }

      setDevices(prev => prev.filter(d => d.id !== deleteDialog.device.id));
      setDeleteDialog({ open: false });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    }
  };

  const handleSendCommandConfirm = async () => {
    if (!commandDialog.device) return;

    try {
      const response = await fetch(`/api/iot/devices/${commandDialog.device.id}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          command: commandForm.command,
          parameters: commandForm.parameters ? JSON.parse(commandForm.parameters) : {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send command');
      }

      const result = await response.json();
      console.log('Command result:', result);
      setCommandDialog({ open: false });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send command');
    }
  };

  const handleToggleDevice = async (device: IoTDevice) => {
    try {
      const response = await fetch(`/api/iot/devices/${device.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isOnline: !device.isOnline
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle device status');
      }

      const updatedDevice = await response.json();
      setDevices(prev => prev.map(d => d.id === device.id ? updatedDevice : d));
      onDeviceUpdated?.(updatedDevice);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle device status');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          IoT Devices ({devices.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDevices}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Protocol</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Battery</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Firmware</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow
                key={device.id}
                hover
                onClick={() => onDeviceSelected?.(device)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getProtocolIcon(device.protocol)}
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {device.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {device.deviceId}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={device.type}
                    size="small"
                    sx={{
                      backgroundColor: getDeviceTypeColor(device.type),
                      color: 'white'
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={device.protocol}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(device.isOnline, device.lastSeen)
                      }}
                    />
                    <Typography variant="body2">
                      {device.isOnline ? 'Online' : 'Offline'}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  {device.batteryLevel !== undefined ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      {getBatteryIcon(device.batteryLevel)}
                      <Typography variant="body2">
                        {device.batteryLevel}%
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {device.firmwareVersion || 'Unknown'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box display="flex" gap={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={device.isOnline}
                          onChange={() => handleToggleDevice(device)}
                          size="small"
                        />
                      }
                      label=""
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, device);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditDevice}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleSendCommand}>
          <SettingsIcon sx={{ mr: 1 }} />
          Send Command
        </MenuItem>
        <MenuItem onClick={handleDeleteDevice}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Device Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          {editDialog.device && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Device Name"
                  defaultValue={editDialog.device.name}
                  onChange={(e) => {
                    if (editDialog.device) {
                      editDialog.device.name = e.target.value;
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Device Type</InputLabel>
                  <Select
                    defaultValue={editDialog.device.type}
                    onChange={(e) => {
                      if (editDialog.device) {
                        editDialog.device.type = e.target.value as DeviceType;
                      }
                    }}
                  >
                    {Object.values(DeviceType).map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Protocol</InputLabel>
                  <Select
                    defaultValue={editDialog.device.protocol}
                    onChange={(e) => {
                      if (editDialog.device) {
                        editDialog.device.protocol = e.target.value as ProtocolType;
                      }
                    }}
                  >
                    {Object.values(ProtocolType).map(protocol => (
                      <MenuItem key={protocol} value={protocol}>{protocol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={() => editDialog.device && handleUpdateDevice(editDialog.device)}
            variant="contained"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
      >
        <DialogTitle>Delete Device</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete device "{deleteDialog.device?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Command Dialog */}
      <Dialog
        open={commandDialog.open}
        onClose={() => setCommandDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Command</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Command"
                value={commandForm.command}
                onChange={(e) => setCommandForm(prev => ({ ...prev, command: e.target.value }))}
                placeholder="e.g., set_temperature, turn_on, lock"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Parameters (JSON)"
                value={commandForm.parameters}
                onChange={(e) => setCommandForm(prev => ({ ...prev, parameters: e.target.value }))}
                placeholder='e.g., {"temperature": 22}'
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommandDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleSendCommandConfirm}
            variant="contained"
            disabled={!commandForm.command.trim()}
          >
            Send Command
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceList;