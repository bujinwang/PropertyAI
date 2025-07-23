import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import {
  LocationOn,
  Warning,
  Error,
  Info,
  Schedule,
  Build,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Close,
  CalendarToday,
  Assessment,
  Timeline
} from '@mui/icons-material';
import { MaintenanceHotspot } from '../../types/building-health';
import StatusIndicator from '../shared/StatusIndicator';

interface MaintenanceHeatmapProps {
  hotspots: MaintenanceHotspot[];
}

interface HotspotDetailModalProps {
  hotspot: MaintenanceHotspot | null;
  open: boolean;
  onClose: () => void;
}

interface IssueHistoryItem {
  id: string;
  date: string;
  issue: string;
  resolution: string;
  duration: string;
  severity: 'low' | 'medium' | 'high';
  cost?: number;
  technician?: string;
}

interface FrequencyData {
  period: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

const HotspotDetailModal: React.FC<HotspotDetailModalProps> = ({
  hotspot,
  open,
  onClose
}) => {
  if (!hotspot) return null;

  const getSeverityIcon = (severity: MaintenanceHotspot['severity']) => {
    switch (severity) {
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity: MaintenanceHotspot['severity']) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Enhanced historical data for the hotspot
  const mockHistory: IssueHistoryItem[] = [
    {
      id: '1',
      date: '2024-01-15',
      issue: 'Power outage in units 301-305',
      resolution: 'Replaced circuit breaker',
      duration: '4 hours',
      severity: 'high',
      cost: 850,
      technician: 'John Smith'
    },
    {
      id: '2',
      date: '2024-01-10',
      issue: 'Voltage fluctuation reported',
      resolution: 'Electrical inspection completed',
      duration: '2 hours',
      severity: 'medium',
      cost: 300,
      technician: 'Mike Johnson'
    },
    {
      id: '3',
      date: '2024-01-05',
      issue: 'Lights flickering in hallway',
      resolution: 'Tightened electrical connections',
      duration: '1 hour',
      severity: 'low',
      cost: 150,
      technician: 'Sarah Davis'
    },
    {
      id: '4',
      date: '2023-12-28',
      issue: 'Circuit overload detected',
      resolution: 'Load balancing adjustment',
      duration: '3 hours',
      severity: 'medium',
      cost: 450,
      technician: 'John Smith'
    },
    {
      id: '5',
      date: '2023-12-20',
      issue: 'Emergency lighting failure',
      resolution: 'Battery replacement',
      duration: '1.5 hours',
      severity: 'high',
      cost: 200,
      technician: 'Mike Johnson'
    }
  ];

  // Frequency trend data
  const frequencyData: FrequencyData[] = [
    { period: 'This Week', count: 2, trend: 'up' },
    { period: 'Last Week', count: 1, trend: 'down' },
    { period: 'This Month', count: hotspot.frequency, trend: 'up' },
    { period: 'Last Month', count: Math.max(1, hotspot.frequency - 2), trend: 'stable' },
    { period: 'This Quarter', count: hotspot.frequency + 5, trend: 'up' }
  ];

  const getTrendIcon = (trend: FrequencyData['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="error" fontSize="small" />;
      case 'down':
        return <TrendingDown color="success" fontSize="small" />;
      default:
        return <TrendingFlat color="action" fontSize="small" />;
    }
  };

  const getTrendColor = (trend: FrequencyData['trend']) => {
    switch (trend) {
      case 'up':
        return 'error.main';
      case 'down':
        return 'success.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <LocationOn color="primary" />
            <Typography variant="h6">{hotspot.location}</Typography>
            <StatusIndicator 
              status={hotspot.severity === 'high' ? 'critical' : hotspot.severity === 'medium' ? 'warning' : 'info'}
              label={`${hotspot.severity} severity`}
              size="small"
            />
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Hotspot Overview */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader title="Hotspot Details" />
              <CardContent>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Issue Type
                  </Typography>
                  <Chip 
                    label={hotspot.issueType}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {hotspot.description}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Frequency
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingUp color="error" />
                    <Typography variant="body1">
                      {hotspot.frequency} incidents in the last 30 days
                    </Typography>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Incident
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Schedule color="action" />
                    <Typography variant="body1">
                      {hotspot.lastIncident.toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Severity Level
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getSeverityIcon(hotspot.severity)}
                    <Chip 
                      label={hotspot.severity.toUpperCase()}
                      color={getSeverityColor(hotspot.severity)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Maintenance Cost (Last 3 months)
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    ${mockHistory.reduce((sum, item) => sum + (item.cost || 0), 0).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Frequency Trends */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader 
                title="Frequency Trends" 
                avatar={<Assessment color="primary" />}
              />
              <CardContent>
                {frequencyData.map((data, index) => (
                  <Box key={index} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        {data.period}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTrendIcon(data.trend)}
                        <Typography 
                          variant="body2" 
                          sx={{ color: getTrendColor(data.trend) }}
                        >
                          {data.count} issues
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (data.count / Math.max(...frequencyData.map(d => d.count))) * 100)}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: data.trend === 'up' ? '#f44336' : 
                                         data.trend === 'down' ? '#4caf50' : '#ff9800'
                        }
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Severity Indicators */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader 
                title="Severity Analysis" 
                avatar={<Timeline color="primary" />}
              />
              <CardContent>
                <Box mb={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Risk Level
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    {getSeverityIcon(hotspot.severity)}
                    <Box flex={1}>
                      <LinearProgress
                        variant="determinate"
                        value={hotspot.severity === 'high' ? 90 : hotspot.severity === 'medium' ? 60 : 30}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getSeverityColor(hotspot.severity) === 'error' ? '#f44336' :
                                           getSeverityColor(hotspot.severity) === 'warning' ? '#ff9800' : '#2196f3'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Resolution Time
                  </Typography>
                  <Typography variant="h6">
                    {mockHistory.reduce((sum, item) => {
                      const hours = parseFloat(item.duration.split(' ')[0]);
                      return sum + hours;
                    }, 0) / mockHistory.length} hours
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Most Common Issue
                  </Typography>
                  <Typography variant="body1">
                    Electrical System Failures
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recommended Action
                  </Typography>
                  <Chip 
                    label="Schedule Preventive Maintenance"
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Issue History Table */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader 
                title="Detailed Issue History" 
                avatar={<CalendarToday color="primary" />}
              />
              <CardContent>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Issue</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Resolution</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Technician</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockHistory.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(item.date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                              {item.issue}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusIndicator 
                              status={item.severity === 'high' ? 'critical' : item.severity === 'medium' ? 'warning' : 'info'}
                              label={item.severity}
                              size="small"
                              variant="dot"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                              {item.resolution}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.duration}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error.main">
                              ${item.cost?.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.technician}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary">
          Schedule Maintenance
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MaintenanceHeatmap: React.FC<MaintenanceHeatmapProps> = ({ hotspots }) => {
  const [selectedHotspot, setSelectedHotspot] = useState<MaintenanceHotspot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const handleHotspotClick = (hotspot: MaintenanceHotspot) => {
    setSelectedHotspot(hotspot);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedHotspot(null);
  };

  const getSeverityColor = (severity: MaintenanceHotspot['severity']) => {
    switch (severity) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  };

  const getSeverityIntensity = (severity: MaintenanceHotspot['severity'], frequency: number) => {
    const baseIntensity = severity === 'high' ? 0.8 : severity === 'medium' ? 0.6 : 0.4;
    const frequencyMultiplier = Math.min(frequency / 10, 1); // Normalize frequency to 0-1
    return Math.max(0.3, baseIntensity * (0.5 + frequencyMultiplier * 0.5));
  };

  const filteredHotspots = useMemo(() => {
    if (filterSeverity === 'all') return hotspots;
    return hotspots.filter(hotspot => hotspot.severity === filterSeverity);
  }, [hotspots, filterSeverity]);

  const getHeatmapData = useMemo(() => {
    // Create a more sophisticated building layout representation
    const buildingAreas = [
      // Floor 4 (Roof/Mechanical)
      { id: 'roof-1', name: 'Roof - North', floor: 4, x: 0, y: 0 },
      { id: 'roof-2', name: 'Roof - Center', floor: 4, x: 1, y: 0 },
      { id: 'roof-3', name: 'Roof - South', floor: 4, x: 2, y: 0 },
      { id: 'mech-1', name: 'Mechanical Room', floor: 4, x: 0, y: 1 },
      { id: 'hvac-1', name: 'HVAC Unit 1', floor: 4, x: 1, y: 1 },
      { id: 'hvac-2', name: 'HVAC Unit 2', floor: 4, x: 2, y: 1 },
      
      // Floor 3
      { id: '3f-1', name: '3rd Floor - West Wing', floor: 3, x: 0, y: 2 },
      { id: '3f-2', name: '3rd Floor - Central', floor: 3, x: 1, y: 2 },
      { id: '3f-3', name: '3rd Floor - East Wing', floor: 3, x: 2, y: 2 },
      { id: '3f-4', name: '3rd Floor - Electrical', floor: 3, x: 0, y: 3 },
      { id: '3f-5', name: '3rd Floor - Hallway', floor: 3, x: 1, y: 3 },
      { id: '3f-6', name: '3rd Floor - Utilities', floor: 3, x: 2, y: 3 },
      
      // Floor 2
      { id: '2f-1', name: '2nd Floor - West Wing', floor: 2, x: 0, y: 4 },
      { id: '2f-2', name: '2nd Floor - Central', floor: 2, x: 1, y: 4 },
      { id: '2f-3', name: '2nd Floor - East Wing', floor: 2, x: 2, y: 4 },
      { id: '2f-4', name: '2nd Floor - Common Area', floor: 2, x: 0, y: 5 },
      { id: '2f-5', name: '2nd Floor - Laundry', floor: 2, x: 1, y: 5 },
      { id: '2f-6', name: '2nd Floor - Storage', floor: 2, x: 2, y: 5 },
      
      // Floor 1 (Ground)
      { id: '1f-1', name: '1st Floor - Lobby', floor: 1, x: 0, y: 6 },
      { id: '1f-2', name: '1st Floor - Office', floor: 1, x: 1, y: 6 },
      { id: '1f-3', name: '1st Floor - Mailroom', floor: 1, x: 2, y: 6 },
      { id: '1f-4', name: '1st Floor - West Units', floor: 1, x: 0, y: 7 },
      { id: '1f-5', name: '1st Floor - East Units', floor: 1, x: 1, y: 7 },
      { id: '1f-6', name: '1st Floor - Parking Access', floor: 1, x: 2, y: 7 },
      
      // Basement
      { id: 'base-1', name: 'Basement - Storage', floor: 0, x: 0, y: 8 },
      { id: 'base-2', name: 'Basement - Utilities', floor: 0, x: 1, y: 8 },
      { id: 'base-3', name: 'Basement - Boiler Room', floor: 0, x: 2, y: 8 },
    ];

    return buildingAreas.map(area => {
      const hotspot = hotspots.find(h => 
        h.location.toLowerCase().includes(area.name.toLowerCase()) ||
        (area.floor === 4 && h.location.toLowerCase().includes('roof')) ||
        (area.floor === 3 && h.location.toLowerCase().includes('3rd floor')) ||
        (area.floor === 0 && h.location.toLowerCase().includes('basement'))
      );

      return {
        ...area,
        hotspot,
        intensity: hotspot ? getSeverityIntensity(hotspot.severity, hotspot.frequency) : 0,
        color: hotspot ? getSeverityColor(hotspot.severity) : '#e0e0e0'
      };
    });
  }, [hotspots]);

  return (
    <>
      <Card>
        <CardHeader 
          title="Maintenance Hotspots"
          subheader="Interactive building heatmap showing maintenance issue frequency and severity"
          action={
            <Box display="flex" gap={1}>
              <Chip
                label="All"
                color={filterSeverity === 'all' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterSeverity('all')}
                clickable
              />
              <Chip
                label="High"
                color={filterSeverity === 'high' ? 'error' : 'default'}
                size="small"
                onClick={() => setFilterSeverity('high')}
                clickable
              />
              <Chip
                label="Medium"
                color={filterSeverity === 'medium' ? 'warning' : 'default'}
                size="small"
                onClick={() => setFilterSeverity('medium')}
                clickable
              />
              <Chip
                label="Low"
                color={filterSeverity === 'low' ? 'info' : 'default'}
                size="small"
                onClick={() => setFilterSeverity('low')}
                clickable
              />
            </Box>
          }
        />
        <CardContent>
          {/* Enhanced Heatmap Grid Visualization */}
          <Box sx={{ mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Building Layout - Interactive Heatmap
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredHotspots.length} active hotspot{filteredHotspots.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            
            {/* Floor Labels */}
            <Box display="flex" justifyContent="space-between" mb={1} px={2}>
              <Typography variant="caption" color="text.secondary">Roof/Mechanical</Typography>
              <Typography variant="caption" color="text.secondary">Floor 4</Typography>
            </Box>
            
            {/* Enhanced grid-based heatmap representation */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                maxWidth: 400,
                mx: 'auto',
                mb: 2
              }}
            >
              {getHeatmapData.map((area) => (
                <Tooltip
                  key={area.id}
                  title={
                    area.hotspot 
                      ? `${area.hotspot.location}\nSeverity: ${area.hotspot.severity}\nFrequency: ${area.hotspot.frequency} incidents\nLast: ${area.hotspot.lastIncident.toLocaleDateString()}`
                      : `${area.name}\nNo issues reported`
                  }
                  arrow
                >
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundColor: area.hotspot 
                        ? `${area.color}${Math.round(area.intensity * 255).toString(16).padStart(2, '0')}`
                        : 'grey.100',
                      border: '2px solid',
                      borderColor: area.hotspot ? area.color : 'grey.300',
                      borderRadius: 1,
                      cursor: area.hotspot ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': area.hotspot ? {
                        transform: 'scale(1.1)',
                        boxShadow: 4,
                        zIndex: 1
                      } : {},
                      '&::before': area.hotspot ? {
                        content: '""',
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        backgroundColor: area.color,
                        borderRadius: '50%',
                        animation: area.hotspot.severity === 'high' ? 'pulse 2s infinite' : 'none'
                      } : {}
                    }}
                    onClick={() => area.hotspot && handleHotspotClick(area.hotspot)}
                  >
                    {area.hotspot && (
                      <>
                        <LocationOn 
                          sx={{ 
                            color: 'white',
                            fontSize: 18,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                            mb: 0.5
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.6rem',
                            textAlign: 'center',
                            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.7))'
                          }}
                        >
                          {area.hotspot.frequency}
                        </Typography>
                      </>
                    )}
                    {!area.hotspot && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.5rem',
                          textAlign: 'center',
                          px: 0.5
                        }}
                      >
                        {area.name.split(' - ')[1] || area.name}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              ))}
            </Box>

            {/* Floor indicators */}
            <Box display="flex" justifyContent="center" gap={4} mb={2}>
              <Typography variant="caption" color="text.secondary">3rd Floor</Typography>
              <Typography variant="caption" color="text.secondary">2nd Floor</Typography>
              <Typography variant="caption" color="text.secondary">1st Floor</Typography>
              <Typography variant="caption" color="text.secondary">Basement</Typography>
            </Box>

            {/* Enhanced Legend */}
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Legend</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Severity Levels
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          backgroundColor: '#f44336cc',
                          borderRadius: 1,
                          border: '2px solid #f44336'
                        }} 
                      />
                      <Typography variant="body2">High Severity (Immediate attention)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          backgroundColor: '#ff9800cc',
                          borderRadius: 1,
                          border: '2px solid #ff9800'
                        }} 
                      />
                      <Typography variant="body2">Medium Severity (Schedule soon)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          backgroundColor: '#2196f3cc',
                          borderRadius: 1,
                          border: '2px solid #2196f3'
                        }} 
                      />
                      <Typography variant="body2">Low Severity (Monitor)</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Frequency Indicators
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn sx={{ color: 'primary.main' }} />
                      <Typography variant="body2">Hotspot location marker</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white', backgroundColor: 'primary.main', px: 1, borderRadius: 1 }}>
                        #
                      </Typography>
                      <Typography variant="body2">Number of incidents (last 30 days)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          backgroundColor: '#f44336',
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }} 
                      />
                      <Typography variant="body2">Critical hotspot (pulsing indicator)</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Summary Statistics */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hotspot Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {hotspots.filter(h => h.severity === 'high').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Severity
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {hotspots.filter(h => h.severity === 'medium').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Medium Severity
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {hotspots.filter(h => h.severity === 'low').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Severity
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {hotspots.reduce((sum, h) => sum + h.frequency, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Incidents
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Hotspot List */}
          <Typography variant="h6" gutterBottom>
            Active Hotspots ({filteredHotspots.length})
          </Typography>
          <Grid container spacing={2}>
            {filteredHotspots.map((hotspot) => (
              <Grid item xs={12} sm={6} md={4} key={hotspot.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid ${getSeverityColor(hotspot.severity)}40`,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                      borderColor: getSeverityColor(hotspot.severity)
                    }
                  }}
                  onClick={() => handleHotspotClick(hotspot)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {hotspot.location}
                      </Typography>
                      <StatusIndicator 
                        status={hotspot.severity === 'high' ? 'critical' : hotspot.severity === 'medium' ? 'warning' : 'info'}
                        label={hotspot.severity}
                        size="small"
                        variant="dot"
                      />
                    </Box>
                    
                    <Chip 
                      label={hotspot.issueType}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {hotspot.description}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUp 
                          sx={{ 
                            color: hotspot.severity === 'high' ? 'error.main' : 
                                   hotspot.severity === 'medium' ? 'warning.main' : 'info.main',
                            fontSize: 16
                          }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {hotspot.frequency} incidents
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {hotspot.lastIncident.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Add CSS animation for pulsing effect */}
      <style>
        {`
          @keyframes pulse {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.2);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>

      <HotspotDetailModal
        hotspot={selectedHotspot}
        open={modalOpen}
        onClose={handleModalClose}
      />
    </>
  );
};

export default MaintenanceHeatmap;