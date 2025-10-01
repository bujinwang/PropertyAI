import React, { useState, useEffect } from 'react';
import { marketingService } from '../../services/marketingService';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface SyndicationPlatform {
  id: string;
  name: string;
  logo: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  totalListings: number;
  activeListings: number;
  monthlyFee: number;
  features: string[];
  apiKey?: string;
  settings: {
    autoSync: boolean;
    syncFrequency: 'hourly' | 'daily' | 'weekly';
    includePhotos: boolean;
    includeVirtualTours: boolean;
  };
}

interface SyncActivity {
  id: string;
  platform: string;
  action: 'sync' | 'create' | 'update' | 'delete';
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  details: string;
}

const MarketingSyndication: React.FC = () => {
  const [platforms, setPlatforms] = useState<SyndicationPlatform[]>([]);
  const [syncActivity, setSyncActivity] = useState<SyncActivity[]>([]);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SyndicationPlatform | null>(null);

  useEffect(() => {
    // Mock data - replace with actual API call
    setPlatforms([
      {
        id: '1',
        name: 'Zillow',
        logo: '/logos/zillow.png',
        enabled: true,
        status: 'connected',
        lastSync: '2024-01-05T10:30:00Z',
        totalListings: 45,
        activeListings: 42,
        monthlyFee: 299,
        features: ['Photos', 'Virtual Tours', 'Lead Management', 'Analytics'],
        settings: {
          autoSync: true,
          syncFrequency: 'daily',
          includePhotos: true,
          includeVirtualTours: true
        }
      },
      {
        id: '2',
        name: 'Apartments.com',
        logo: '/logos/apartments.png',
        enabled: true,
        status: 'connected',
        lastSync: '2024-01-05T09:15:00Z',
        totalListings: 38,
        activeListings: 35,
        monthlyFee: 199,
        features: ['Photos', 'Floor Plans', 'Amenities', 'Reviews'],
        settings: {
          autoSync: true,
          syncFrequency: 'daily',
          includePhotos: true,
          includeVirtualTours: false
        }
      },
      {
        id: '3',
        name: 'Rent.com',
        logo: '/logos/rent.png',
        enabled: false,
        status: 'disconnected',
        lastSync: '2024-01-01T00:00:00Z',
        totalListings: 0,
        activeListings: 0,
        monthlyFee: 149,
        features: ['Photos', 'Basic Listing', 'Contact Forms'],
        settings: {
          autoSync: false,
          syncFrequency: 'weekly',
          includePhotos: true,
          includeVirtualTours: false
        }
      },
      {
        id: '4',
        name: 'Trulia',
        logo: '/logos/trulia.png',
        enabled: true,
        status: 'error',
        lastSync: '2024-01-04T14:20:00Z',
        totalListings: 28,
        activeListings: 0,
        monthlyFee: 179,
        features: ['Photos', 'Neighborhood Info', 'Price History'],
        settings: {
          autoSync: true,
          syncFrequency: 'daily',
          includePhotos: true,
          includeVirtualTours: true
        }
      }
    ]);

    setSyncActivity([
      {
        id: '1',
        platform: 'Zillow',
        action: 'sync',
        status: 'success',
        timestamp: '2024-01-05T10:30:00Z',
        details: 'Successfully synced 42 listings'
      },
      {
        id: '2',
        platform: 'Apartments.com',
        action: 'update',
        status: 'success',
        timestamp: '2024-01-05T09:15:00Z',
        details: 'Updated 3 listing prices'
      },
      {
        id: '3',
        platform: 'Trulia',
        action: 'sync',
        status: 'error',
        timestamp: '2024-01-04T14:20:00Z',
        details: 'API authentication failed'
      },
      {
        id: '4',
        platform: 'Zillow',
        action: 'create',
        status: 'success',
        timestamp: '2024-01-04T11:45:00Z',
        details: 'Created 2 new listings'
      }
    ]);
  }, []);

  const handleTogglePlatform = (platformId: string) => {
    setPlatforms(platforms.map(p => 
      p.id === platformId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleOpenSettings = (platform: SyndicationPlatform) => {
    setSelectedPlatform(platform);
    setOpenSettingsDialog(true);
  };

  const handleSaveSettings = () => {
    if (selectedPlatform) {
      setPlatforms(platforms.map(p => 
        p.id === selectedPlatform.id ? selectedPlatform : p
      ));
    }
    setOpenSettingsDialog(false);
  };

  const handleSyncNow = async (platformId: string) => {
    try {
      await marketingService.syncPlatform(platformId);
      // Reload platforms to show updated sync status
      const response = await marketingService.getSyndicationPlatforms();
      setPlatforms(response.data || []);
    } catch (error) {
      console.error('Error syncing platform:', error);
    }
  };

  const getStatusIcon = (status: SyndicationPlatform['status']) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'syncing': return <SyncIcon color="primary" />;
      case 'disconnected': return <WarningIcon color="warning" />;
      default: return null;
    }
  };

  const getStatusColor = (status: SyndicationPlatform['status']) => {
    switch (status) {
      case 'connected': return 'success';
      case 'error': return 'error';
      case 'syncing': return 'primary';
      case 'disconnected': return 'warning';
      default: return 'default';
    }
  };

  const totalActiveListings = platforms.reduce((sum, p) => sum + p.activeListings, 0);
  const totalMonthlyCost = platforms.filter(p => p.enabled).reduce((sum, p) => sum + p.monthlyFee, 0);
  const connectedPlatforms = platforms.filter(p => p.status === 'connected').length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Listing Syndication
        </Typography>
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          onClick={() => console.log('Sync all platforms')}
        >
          Sync All
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Connected Platforms
              </Typography>
              <Typography variant="h4">
                {connectedPlatforms}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                of {platforms.length} available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Listings
              </Typography>
              <Typography variant="h4">
                {totalActiveListings}
              </Typography>
              <Typography variant="body2" color="success.main">
                Across all platforms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Monthly Cost
              </Typography>
              <Typography variant="h4">
                ${totalMonthlyCost}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                For enabled platforms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Last Sync
              </Typography>
              <Typography variant="h4">
                2h ago
              </Typography>
              <Typography variant="body2" color="success.main">
                All platforms synced
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Platform Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {platforms.map((platform) => (
          <Grid item xs={12} md={6} lg={4} key={platform.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {platform.name.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="h6">{platform.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(platform.status)}
                        <Chip
                          label={platform.status}
                          color={getStatusColor(platform.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={platform.enabled}
                        onChange={() => handleTogglePlatform(platform.id)}
                      />
                    }
                    label=""
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Active Listings
                    </Typography>
                    <Typography variant="h6">
                      {platform.activeListings}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Monthly Fee
                    </Typography>
                    <Typography variant="h6">
                      ${platform.monthlyFee}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Last sync: {new Date(platform.lastSync).toLocaleString()}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {platform.features.slice(0, 3).map((feature) => (
                    <Chip key={feature} label={feature} size="small" variant="outlined" />
                  ))}
                  {platform.features.length > 3 && (
                    <Chip label={`+${platform.features.length - 3} more`} size="small" variant="outlined" />
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<SettingsIcon />}
                    onClick={() => handleOpenSettings(platform)}
                  >
                    Settings
                  </Button>
                  <Button
                    size="small"
                    startIcon={<SyncIcon />}
                    onClick={() => handleSyncNow(platform.id)}
                    disabled={!platform.enabled}
                  >
                    Sync Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Sync Activity
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Platform</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syncActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.platform}</TableCell>
                    <TableCell>
                      <Chip label={activity.action} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.status}
                        color={activity.status === 'success' ? 'success' : activity.status === 'error' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{activity.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Platform Settings Dialog */}
      <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPlatform?.name} Settings
        </DialogTitle>
        <DialogContent>
          {selectedPlatform && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Configure how your listings are synced with {selectedPlatform.name}
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={selectedPlatform.apiKey || ''}
                  onChange={(e) => setSelectedPlatform({
                    ...selectedPlatform,
                    apiKey: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sync Frequency</InputLabel>
                  <Select
                    value={selectedPlatform.settings.syncFrequency}
                    label="Sync Frequency"
                    onChange={(e) => setSelectedPlatform({
                      ...selectedPlatform,
                      settings: {
                        ...selectedPlatform.settings,
                        syncFrequency: e.target.value as any
                      }
                    })}
                  >
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedPlatform.settings.autoSync}
                      onChange={(e) => setSelectedPlatform({
                        ...selectedPlatform,
                        settings: {
                          ...selectedPlatform.settings,
                          autoSync: e.target.checked
                        }
                      })}
                    />
                  }
                  label="Enable automatic sync"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedPlatform.settings.includePhotos}
                      onChange={(e) => setSelectedPlatform({
                        ...selectedPlatform,
                        settings: {
                          ...selectedPlatform.settings,
                          includePhotos: e.target.checked
                        }
                      })}
                    />
                  }
                  label="Include photos in sync"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedPlatform.settings.includeVirtualTours}
                      onChange={(e) => setSelectedPlatform({
                        ...selectedPlatform,
                        settings: {
                          ...selectedPlatform.settings,
                          includeVirtualTours: e.target.checked
                        }
                      })}
                    />
                  }
                  label="Include virtual tours"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketingSyndication;