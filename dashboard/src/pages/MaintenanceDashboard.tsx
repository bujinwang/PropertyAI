import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp,
  History,
  Assignment,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  AttachMoney,
  Build
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiService } from '../services/apiService';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';

// Types
interface MaintenanceItem {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'predicted';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  scheduledDate: string;
  completedDate?: string;
  estimatedCost: number;
  actualCost?: number;
  property: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
  };
  system: string;
  equipment: string;
  assignedTo?: string;
  duration?: number;
  pattern?: {
    frequency: number;
    lastOccurrence: string;
    predictedNext: string;
    confidence: number;
  };
}

interface CostProjection {
  month: string;
  preventive: number;
  corrective: number;
  emergency: number;
  total: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`maintenance-tabpanel-${index}`}
      aria-labelledby={`maintenance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MaintenanceDashboard: React.FC = () => {
  // State management
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null);
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    property: '',
    system: '',
    priority: '',
    status: '',
    dateRange: '6months'
  });

  // Mock data for demonstration (replace with actual API calls)
  const mockMaintenanceItems: MaintenanceItem[] = [
    {
      id: '1',
      title: 'HVAC System Inspection',
      description: 'Quarterly inspection and filter replacement',
      type: 'preventive',
      priority: 'medium',
      status: 'scheduled',
      scheduledDate: '2024-02-15',
      estimatedCost: 250,
      property: { id: 'p1', name: 'Downtown Apartments' },
      unit: { id: 'u1', unitNumber: '101' },
      system: 'HVAC',
      equipment: 'Central Air Unit',
      pattern: {
        frequency: 90,
        lastOccurrence: '2023-11-15',
        predictedNext: '2024-02-15',
        confidence: 0.95
      }
    },
    {
      id: '2',
      title: 'Water Heater Replacement',
      description: 'Predicted failure based on age and performance data',
      type: 'predicted',
      priority: 'high',
      status: 'scheduled',
      scheduledDate: '2024-01-20',
      estimatedCost: 1200,
      property: { id: 'p2', name: 'Suburban Complex' },
      unit: { id: 'u2', unitNumber: '205' },
      system: 'Plumbing',
      equipment: 'Water Heater',
      pattern: {
        frequency: 2920,
        lastOccurrence: '2016-01-15',
        predictedNext: '2024-01-20',
        confidence: 0.87
      }
    },
    {
      id: '3',
      title: 'Elevator Motor Repair',
      description: 'Emergency repair due to unusual noise',
      type: 'emergency',
      priority: 'critical',
      status: 'in-progress',
      scheduledDate: '2024-01-10',
      estimatedCost: 3500,
      actualCost: 3200,
      property: { id: 'p1', name: 'Downtown Apartments' },
      system: 'Elevator',
      equipment: 'Motor Assembly',
      assignedTo: 'TechCorp Services'
    },
    {
      id: '4',
      title: 'Roof Inspection',
      description: 'Annual roof inspection and minor repairs',
      type: 'preventive',
      priority: 'low',
      status: 'completed',
      scheduledDate: '2023-12-01',
      completedDate: '2023-12-03',
      estimatedCost: 500,
      actualCost: 450,
      property: { id: 'p3', name: 'Garden View Condos' },
      system: 'Structural',
      equipment: 'Roof',
      duration: 4
    }
  ];

  // Mock cost projection data
  const costProjectionData: CostProjection[] = [
    { month: 'Jan', preventive: 2500, corrective: 1800, emergency: 3200, total: 7500 },
    { month: 'Feb', preventive: 3200, corrective: 2100, emergency: 1500, total: 6800 },
    { month: 'Mar', preventive: 2800, corrective: 2500, emergency: 2200, total: 7500 },
    { month: 'Apr', preventive: 3500, corrective: 1900, emergency: 1800, total: 7200 },
    { month: 'May', preventive: 3100, corrective: 2300, emergency: 2800, total: 8200 },
    { month: 'Jun', preventive: 2900, corrective: 2000, emergency: 1600, total: 6500 }
  ];

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, you would fetch from multiple endpoints
        // const [maintenanceResponse, predictionsResponse] = await Promise.all([
        //   apiService.get('/maintenance'),
        //   predictiveMaintenanceService.getPredictions(filters)
        // ]);
        
        // For now, using mock data
        setMaintenanceItems(mockMaintenanceItems);
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
        setError('Failed to load maintenance data');
        setMaintenanceItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Filtered and processed data
  const filteredItems = useMemo(() => {
    return maintenanceItems.filter(item => {
      if (filters.property && item.property.id !== filters.property) return false;
      if (filters.system && item.system !== filters.system) return false;
      if (filters.priority && item.priority !== filters.priority) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
  }, [maintenanceItems, filters]);

  // Timeline data processing
  const timelineData = useMemo(() => {
    const sortedItems = [...filteredItems].sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
    
    return sortedItems.map(item => ({
      ...item,
      x: new Date(item.scheduledDate).getTime(),
      y: item.estimatedCost,
      size: item.priority === 'critical' ? 20 : item.priority === 'high' ? 15 : 10
    }));
  }, [filteredItems]);

  // Pattern recognition analysis
  const patternAnalysis = useMemo(() => {
    const systemPatterns = filteredItems.reduce((acc, item) => {
      if (!item.pattern) return acc;
      
      if (!acc[item.system]) {
        acc[item.system] = {
          count: 0,
          avgFrequency: 0,
          avgConfidence: 0,
          items: []
        };
      }
      
      acc[item.system].count++;
      acc[item.system].avgFrequency += item.pattern.frequency;
      acc[item.system].avgConfidence += item.pattern.confidence;
      acc[item.system].items.push(item);
      
      return acc;
    }, {} as any);

    Object.keys(systemPatterns).forEach(system => {
      systemPatterns[system].avgFrequency /= systemPatterns[system].count;
      systemPatterns[system].avgConfidence /= systemPatterns[system].count;
    });

    return systemPatterns;
  }, [filteredItems]);

  // Event handlers
  const handleCreateWorkOrder = async () => {
    if (!selectedItem) return;
    
    try {
      await predictiveMaintenanceService.createWorkOrderFromPrediction(selectedItem.id);
      setWorkOrderDialogOpen(false);
      setSelectedItem(null);
      // Refresh data
      // fetchData();
    } catch (error) {
      console.error('Error creating work order:', error);
    }
  };

  const handleItemSelect = (item: MaintenanceItem) => {
    setSelectedItem(item);
    if (item.type === 'predicted' || item.status === 'scheduled') {
      setWorkOrderDialogOpen(true);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'scheduled': return 'info';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Maintenance Dashboard
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Property</InputLabel>
              <Select
                value={filters.property}
                onChange={(e) => setFilters(prev => ({ ...prev, property: e.target.value }))}
              >
                <MenuItem value="">All Properties</MenuItem>
                <MenuItem value="p1">Downtown Apartments</MenuItem>
                <MenuItem value="p2">Suburban Complex</MenuItem>
                <MenuItem value="p3">Garden View Condos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>System</InputLabel>
              <Select
                value={filters.system}
                onChange={(e) => setFilters(prev => ({ ...prev, system: e.target.value }))}
              >
                <MenuItem value="">All Systems</MenuItem>
                <MenuItem value="HVAC">HVAC</MenuItem>
                <MenuItem value="Plumbing">Plumbing</MenuItem>
                <MenuItem value="Electrical">Electrical</MenuItem>
                <MenuItem value="Elevator">Elevator</MenuItem>
                <MenuItem value="Structural">Structural</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<TimelineIcon />} label="Timeline" />
          <Tab icon={<TrendingUp />} label="Cost Projections" />
          <Tab icon={<History />} label="History & Patterns" />
          <Tab icon={<Assignment />} label="Work Orders" />
        </Tabs>

        {/* Timeline Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Maintenance Timeline
          </Typography>
          <Box sx={{ height: 400, mb: 3 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="scheduledDate"
                  type="category"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <RechartsTooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any, name: string) => [
                    name === 'estimatedCost' ? `$${value}` : value,
                    name === 'estimatedCost' ? 'Estimated Cost' : name
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="estimatedCost" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 6, onClick: (data: any) => handleItemSelect(data.payload) }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          
          {/* Interactive Timeline Items */}
          <Grid container spacing={2}>
            {timelineData.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 },
                    border: selectedItem?.id === item.id ? 2 : 0,
                    borderColor: 'primary.main'
                  }}
                  onClick={() => handleItemSelect(item)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.title}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={item.priority}
                        sx={{ backgroundColor: getPriorityColor(item.priority), color: 'white' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        {new Date(item.scheduledDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${item.estimatedCost}
                      </Typography>
                    </Box>
                    <Chip 
                      size="small" 
                      label={item.status}
                      color={getStatusColor(item.status) as any}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Cost Projections Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Cost Projections
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Monthly Cost Breakdown
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={costProjectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: any) => [`$${value}`, '']} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="preventive" 
                        stackId="1" 
                        stroke="#4caf50" 
                        fill="#4caf50" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="corrective" 
                        stackId="1" 
                        stroke="#ff9800" 
                        fill="#ff9800" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="emergency" 
                        stackId="1" 
                        stroke="#f44336" 
                        fill="#f44336" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Cost Summary
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Preventive', value: 18000, fill: '#4caf50' },
                          { name: 'Corrective', value: 12600, fill: '#ff9800' },
                          { name: 'Emergency', value: 13100, fill: '#f44336' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value}`}
                      />
                      <RechartsTooltip formatter={(value: any) => [`$${value}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Key Metrics
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Total Projected:</Typography>
                    <Typography variant="body2" fontWeight="bold">$43,700</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Avg Monthly:</Typography>
                    <Typography variant="body2" fontWeight="bold">$7,283</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Emergency %:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="error.main">30%</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* History & Patterns Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Maintenance History & Pattern Recognition
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  System Pattern Analysis
                </Typography>
                {Object.entries(patternAnalysis).map(([system, data]: [string, any]) => (
                  <Card key={system} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {system}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Avg Frequency
                          </Typography>
                          <Typography variant="body1">
                            {Math.round(data.avgFrequency)} days
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Confidence
                          </Typography>
                          <Typography variant="body1">
                            {Math.round(data.avgConfidence * 100)}%
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          Items: {data.count}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recent History
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Item</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems
                        .filter(item => item.status === 'completed')
                        .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.completedDate ? new Date(item.completedDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>${item.actualCost || item.estimatedCost}</TableCell>
                          <TableCell>
                            <Chip size="small" label={item.status} color="success" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Work Orders Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Work Order Management
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Scheduled Date</TableCell>
                  <TableCell>Est. Cost</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={item.type}
                        color={item.type === 'emergency' ? 'error' : item.type === 'predicted' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={item.priority}
                        sx={{ backgroundColor: getPriorityColor(item.priority), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={item.status}
                        color={getStatusColor(item.status) as any}
                      />
                    </TableCell>
                    <TableCell>{item.property.name}</TableCell>
                    <TableCell>{new Date(item.scheduledDate).toLocaleDateString()}</TableCell>
                    <TableCell>${item.estimatedCost}</TableCell>
                    <TableCell>
                      {(item.type === 'predicted' || item.status === 'scheduled') && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleItemSelect(item)}
                        >
                          Convert to Work Order
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Work Order Creation Dialog */}
      <Dialog open={workOrderDialogOpen} onClose={() => setWorkOrderDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Work Order</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedItem.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedItem.description}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Property"
                    value={selectedItem.property.name}
                    disabled
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="System"
                    value={selectedItem.system}
                    disabled
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Priority"
                    value={selectedItem.priority}
                    disabled
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Estimated Cost"
                    value={`$${selectedItem.estimatedCost}`}
                    disabled
                  />
                </Grid>
                {selectedItem.pattern && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Pattern Analysis
                      </Typography>
                      <Typography variant="body2">
                        Confidence: {Math.round(selectedItem.pattern.confidence * 100)}%
                      </Typography>
                      <Typography variant="body2">
                        Frequency: Every {selectedItem.pattern.frequency} days
                      </Typography>
                      <Typography variant="body2">
                        Last Occurrence: {new Date(selectedItem.pattern.lastOccurrence).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkOrderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateWorkOrder} variant="contained">
            Create Work Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenanceDashboard;
