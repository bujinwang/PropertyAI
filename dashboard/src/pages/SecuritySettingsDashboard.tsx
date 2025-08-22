import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Security as SecurityIcon,
  DeviceHub as DeviceIcon,
  Notifications as NotificationsIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Shield as ShieldIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastAccess: string;
  location: string;
  trusted: boolean;
}

interface LoginAttempt {
  id: string;
  timestamp: string;
  location: string;
  success: boolean;
  ipAddress: string;
}

interface NotificationSettings {
  loginAlerts: boolean;
  deviceChanges: boolean;
  securityUpdates: boolean;
  suspiciousActivity: boolean;
  weeklyReports: boolean;
}

const SecuritySettingsDashboard: React.FC = () => {
  const [securityLevel, setSecurityLevel] = useState(75);
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'MacBook Pro',
      type: 'desktop',
      lastAccess: '2 hours ago',
      location: 'San Francisco, CA',
      trusted: true
    },
    {
      id: '2',
      name: 'iPhone 14',
      type: 'mobile',
      lastAccess: '1 day ago',
      location: 'San Francisco, CA',
      trusted: true
    },
    {
      id: '3',
      name: 'Unknown Device',
      type: 'desktop',
      lastAccess: '3 days ago',
      location: 'New York, NY',
      trusted: false
    }
  ]);
  
  const [loginAttempts] = useState<LoginAttempt[]>([
    {
      id: '1',
      timestamp: '2024-01-15 14:30',
      location: 'San Francisco, CA',
      success: true,
      ipAddress: '192.168.1.1'
    },
    {
      id: '2',
      timestamp: '2024-01-15 09:15',
      location: 'San Francisco, CA',
      success: true,
      ipAddress: '192.168.1.1'
    },
    {
      id: '3',
      timestamp: '2024-01-14 22:45',
      location: 'New York, NY',
      success: false,
      ipAddress: '203.0.113.1'
    }
  ]);
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    loginAlerts: true,
    deviceChanges: true,
    securityUpdates: true,
    suspiciousActivity: true,
    weeklyReports: false
  });
  
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const getSecurityLevelColor = (level: number) => {
    if (level >= 80) return 'success';
    if (level >= 60) return 'warning';
    return 'error';
  };

  const getSecurityLevelText = (level: number) => {
    if (level >= 80) return 'Strong';
    if (level >= 60) return 'Moderate';
    return 'Weak';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <SmartphoneIcon />;
      case 'tablet':
        return <TabletIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const handleDeviceAction = (device: Device, action: 'edit' | 'delete') => {
    if (action === 'edit') {
      setSelectedDevice(device);
      setDeviceDialogOpen(true);
    } else {
      setDevices(devices.filter(d => d.id !== device.id));
    }
  };

  const handleNotificationChange = (setting: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Security Settings
      </Typography>

      <Grid container spacing={4}>
        {/* Account Security Level */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <ShieldIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Account Security Level
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body1" color="text.secondary">
                  Current Security Level: {getSecurityLevelText(securityLevel)}
                </Typography>
                <Chip 
                  label={`${securityLevel}%`} 
                  color={getSecurityLevelColor(securityLevel) as any}
                  variant="filled"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={securityLevel} 
                color={getSecurityLevelColor(securityLevel) as any}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              A visual indicator of your account security level will be displayed here.
            </Typography>
          </Paper>
        </Grid>

        {/* Login Attempts */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Login Attempts
              </Typography>
            </Box>
            
            {/* Map Placeholder */}
            <Box 
              sx={{ 
                height: 300, 
                bgcolor: 'grey.100', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 3,
                border: '2px dashed',
                borderColor: 'grey.300'
              }}
            >
              <Typography variant="body1" color="text.secondary" textAlign="center">
                A map visualizing recent login attempts will be implemented here.
              </Typography>
            </Box>
            
            {/* Recent Login Attempts Table */}
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loginAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>{attempt.timestamp}</TableCell>
                      <TableCell>{attempt.location}</TableCell>
                      <TableCell>{attempt.ipAddress}</TableCell>
                      <TableCell>
                        <Chip
                          icon={attempt.success ? <CheckCircleIcon /> : <WarningIcon />}
                          label={attempt.success ? 'Success' : 'Failed'}
                          color={attempt.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Authorized Devices */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <DeviceIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Authorized Devices
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              A list of devices with access to your account will be displayed here.
            </Typography>
            
            <List>
              {devices.map((device, index) => (
                <React.Fragment key={device.id}>
                  <ListItem>
                    <Avatar sx={{ mr: 2, bgcolor: device.trusted ? 'success.main' : 'warning.main' }}>
                      {getDeviceIcon(device.type)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">{device.name}</Typography>
                          {!device.trusted && (
                            <Chip label="Unverified" color="warning" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Last access: {device.lastAccess} • {device.location}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Edit Device">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleDeviceAction(device, 'edit')}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove Device">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleDeviceAction(device, 'delete')}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < devices.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Notification Preferences */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <NotificationsIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Notification Preferences
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Granular notification preferences for account activity will be available here.
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.loginAlerts}
                    onChange={() => handleNotificationChange('loginAlerts')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1">Login Alerts</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get notified when someone logs into your account
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.deviceChanges}
                    onChange={() => handleNotificationChange('deviceChanges')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1">Device Changes</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alerts when new devices are added or removed
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.securityUpdates}
                    onChange={() => handleNotificationChange('securityUpdates')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1">Security Updates</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Important security announcements and updates
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.suspiciousActivity}
                    onChange={() => handleNotificationChange('suspiciousActivity')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1">Suspicious Activity</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Immediate alerts for unusual account activity
                    </Typography>
                  </Box>
                }
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.weeklyReports}
                    onChange={() => handleNotificationChange('weeklyReports')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1">Weekly Security Reports</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Summary of account activity and security status
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>

      {/* Device Edit Dialog */}
      <Dialog open={deviceDialogOpen} onClose={() => setDeviceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Device Name"
            fullWidth
            variant="outlined"
            defaultValue={selectedDevice?.name}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                defaultChecked={selectedDevice?.trusted}
                color="primary"
              />
            }
            label="Mark as trusted device"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setDeviceDialogOpen(false)} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SecuritySettingsDashboard;
