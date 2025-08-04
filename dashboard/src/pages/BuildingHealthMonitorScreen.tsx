import React, { useState, useEffect } from 'react';
import {
 Container,
 Typography,
 Grid,
 Card,
 CardContent,
 CardHeader,
 Box,
 CircularProgress,
 Alert,
 Tabs,
 Tab,
 LinearProgress,
 Chip
} from '@mui/material';
import { 
 TrendingUp, 
 TrendingDown, 
 TrendingFlat,
 Schedule,
 Warning,
 CheckCircle
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
 Chart as ChartJS,
 CategoryScale,
 LinearScale,
 PointElement,
 LineElement,
 Title,
 Tooltip,
 Legend,
 ArcElement,
} from 'chart.js';

import StatusIndicator from '../components/shared/StatusIndicator';
import { MaintenanceHeatmap, PredictiveMaintenanceAlerts } from '../components/building-health';
import { BuildingHealthService } from '../services/buildingHealthService';
import { BuildingHealth, HealthCategory, BuildingSystem } from '../types/building-health';
import { AIFeedback } from '../types/ai';

// Register Chart.js components
ChartJS.register(
 CategoryScale,
 LinearScale,
 PointElement,
 LineElement,
 Title,
 Tooltip,
 Legend,
 ArcElement
);

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
   id={`building-health-tabpanel-${index}`}
   aria-labelledby={`building-health-tab-${index}`}
   {...other}
  >
   {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
 );
}

const BuildingHealthMonitorScreen: React.FC = () => {
 const [buildingHealth, setBuildingHealth] = useState<BuildingHealth | null>(null);
 const [buildingSystems, setBuildingSystems] = useState<BuildingSystem[]>([]);
 const [healthMetrics, setHealthMetrics] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState(0);
 const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

 useEffect(() => {
  loadBuildingHealthData();
 }, [timeRange]);

 const loadBuildingHealthData = async () => {
  try {
   setLoading(true);
   setError(null);

   const [healthData, systemsData, metricsData] = await Promise.all([
    BuildingHealthService.getBuildingHealth(),
    BuildingHealthService.getBuildingSystems(),
    BuildingHealthService.getHealthMetrics(timeRange)
   ]);

   setBuildingHealth(healthData);
   setBuildingSystems(systemsData);
   setHealthMetrics(metricsData);
  } catch (err) {
   setError('Failed to load building health data');
   console.error('Error loading building health data:', err);
  } finally {
   setLoading(false);
  }
 };

 const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
  setActiveTab(newValue);
 };

 const handleAlertAction = async (alertId: string, action: string) => {
  try {
   console.log(`Handling alert action: ${action} for alert ${alertId}`);
   // Here you would typically call an API to handle the action
   // For now, we'll just log it
   if (action === 'schedule') {
    // Navigate to scheduling interface or open modal
    console.log('Opening scheduling interface...');
   } else if (action === 'details') {
    // Navigate to detailed view or open modal
    console.log('Opening detailed view...');
   }
  } catch (error) {
   console.error('Error handling alert action:', error);
  }
 };

 const handleAlertFeedback = async (alertId: string, feedback: AIFeedback) => {
  try {
   console.log(`Received feedback for alert ${alertId}:`, feedback);
   // Here you would typically send feedback to your AI service
   // This helps improve the AI predictions over time
  } catch (error) {
   console.error('Error submitting alert feedback:', error);
  }
 };

 const getScoreColor = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
 };

 const getTrendIcon = (trend: HealthCategory['trend']) => {
  switch (trend) {
   case 'improving':
    return <TrendingUp color="success" />;
   case 'declining':
    return <TrendingDown color="error" />;
   default:
    return <TrendingFlat color="action" />;
  }
 };

 const createHealthScoreChart = () => {
  if (!buildingHealth) return null;

  return {
   labels: buildingHealth.categories.map(cat => cat.name),
   datasets: [
    {
     data: buildingHealth.categories.map(cat => cat.score),
     backgroundColor: buildingHealth.categories.map(cat => {
      if (cat.score >= 80) return '#4caf50';
      if (cat.score >= 60) return '#ff9800';
      return '#f44336';
     }),
     borderWidth: 2,
     borderColor: '#fff'
    }
   ]
  };
 };

 const createTrendChart = () => {
  if (!healthMetrics) return null;

  return {
   labels: healthMetrics.overallScore.map((item: any) => item.date),
   datasets: [
    {
     label: 'Overall Health Score',
     data: healthMetrics.overallScore.map((item: any) => item.value),
     borderColor: '#2196f3',
     backgroundColor: 'rgba(33, 150, 243, 0.1)',
     tension: 0.4,
     fill: true
    },
    {
     label: 'HVAC',
     data: healthMetrics.hvac.map((item: any) => item.value),
     borderColor: '#4caf50',
     backgroundColor: 'rgba(76, 175, 80, 0.1)',
     tension: 0.4
    },
    {
     label: 'Electrical',
     data: healthMetrics.electrical.map((item: any) => item.value),
     borderColor: '#f44336',
     backgroundColor: 'rgba(244, 67, 54, 0.1)',
     tension: 0.4
    }
   ]
  };
 };

 if (loading) {
  return (
   <Container maxWidth="xl" sx={{ py: 4 }}>
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
     <CircularProgress />
    </Box>
   </Container>
  );
 }

 if (error) {
  return (
   <Container maxWidth="xl" sx={{ py: 4 }}>
    <Alert severity="error">{error}</Alert>
   </Container>
  );
 }

 if (!buildingHealth) {
  return (
   <Container maxWidth="xl" sx={{ py: 4 }}>
    <Alert severity="info">No building health data available</Alert>
   </Container>
  );
 }

 return (
  <Container maxWidth="xl" sx={{ py: 4 }}>
   <Typography variant="h4" component="h1" gutterBottom>
    Building Health Monitor
   </Typography>

   {/* Overall Health Score */}
   <Card sx={{ mb: 3 }}>
    <CardHeader 
     title="Overall Building Health Score"
     action={
      <Box display="flex" alignItems="center" gap={2}>
       <Chip 
        label={`Score: ${buildingHealth.overallScore}/100`}
        color={getScoreColor(buildingHealth.overallScore)}
        size="medium"
       />
       <Typography variant="body2" color="text.secondary">
        Last updated: {buildingHealth.lastUpdated.toLocaleDateString()}
       </Typography>
      </Box>
     }
    />
    <CardContent>
     <Grid container spacing={3}>
      <Grid xs={12} md={8}>
       <Box sx={{ mb: 2 }}>
        <LinearProgress
         variant="determinate"
         value={buildingHealth.overallScore}
         sx={{ 
          height: 12, 
          borderRadius: 6,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
           backgroundColor: buildingHealth.overallScore >= 80 ? '#4caf50' : 
                   buildingHealth.overallScore >= 60 ? '#ff9800' : '#f44336'
          }
         }}
        />
       </Box>
       <Grid container spacing={2}>
        {buildingHealth.categories.map((category) => (
         <Grid xs={12} sm={6} md={4} key={category.name}>
          <Card variant="outlined">
           <CardContent sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
             <Typography variant="subtitle2" noWrap>
              {category.name}
             </Typography>
             {getTrendIcon(category.trend)}
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
             <Typography variant="h6" color={getScoreColor(category.score)}>
              {category.score}%
             </Typography>
             <StatusIndicator 
              status={category.status}
              label={category.status}
              size="small"
              variant="dot"
             />
            </Box>
           </CardContent>
          </Card>
         </Grid>
        ))}
       </Grid>
      </Grid>
      <Grid xs={12} md={4}>
       {healthMetrics && (
        <Box sx={{ height: 300 }}>
         <Doughnut 
          data={createHealthScoreChart()!}
          options={{
           responsive: true,
           maintainAspectRatio: false,
           plugins: {
            legend: {
             position: 'bottom'
            },
            title: {
             display: true,
             text: 'Health Score Breakdown'
            }
           }
          }}
         />
        </Box>
       )}
      </Grid>
     </Grid>
    </CardContent>
   </Card>

   {/* Building Systems Status */}
   <Card sx={{ mb: 3 }}>
    <CardHeader title="Building Systems Status" />
    <CardContent>
     <Grid container spacing={2}>
      {buildingSystems.map((system) => (
       <Grid xs={12} sm={6} md={4} key={system.id}>
        <Card variant="outlined">
         <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
           <Typography variant="h6">{system.name}</Typography>
           <StatusIndicator 
            status={system.status}
            label={system.status}
            size="medium"
           />
          </Box>
          
          <Box mb={2}>
           <Typography variant="body2" color="text.secondary" gutterBottom>
            Efficiency: {system.efficiency}%
           </Typography>
           <LinearProgress
            variant="determinate"
            value={system.efficiency}
            sx={{ 
             height: 6, 
             borderRadius: 3,
             backgroundColor: 'grey.200'
            }}
           />
          </Box>

          <Box display="flex" alignItems="center" gap={1} mb={1}>
           <Schedule fontSize="small" color="action" />
           <Typography variant="body2" color="text.secondary">
            Next maintenance: {system.nextMaintenance.toLocaleDateString()}
           </Typography>
          </Box>

          {system.alerts.length > 0 && (
           <Box mt={2}>
            {system.alerts.map((alert) => (
             <Box key={alert.id} display="flex" alignItems="center" gap={1} mb={1}>
              {alert.severity === 'error' ? (
               <Warning color="error" fontSize="small" />
              ) : alert.severity === 'warning' ? (
               <Warning color="warning" fontSize="small" />
              ) : (
               <CheckCircle color="info" fontSize="small" />
              )}
              <Typography variant="body2" color="text.secondary">
               {alert.message}
              </Typography>
             </Box>
            ))}
           </Box>
          )}
         </CardContent>
        </Card>
       </Grid>
      ))}
     </Grid>
    </CardContent>
   </Card>

   {/* Predictive Maintenance Alerts */}
   <Box sx={{ mb: 3 }}>
    <PredictiveMaintenanceAlerts 
     alerts={buildingHealth.predictiveAlerts}
     onAlertAction={handleAlertAction}
     onFeedback={handleAlertFeedback}
    />
   </Box>

   {/* Maintenance Hotspots */}
   <Box sx={{ mb: 3 }}>
    <MaintenanceHeatmap hotspots={buildingHealth.hotspots} />
   </Box>

   {/* Historical Trends */}
   <Card>
    <CardHeader 
     title="Historical Health Trends"
     action={
      <Tabs value={activeTab} onChange={handleTabChange}>
       <Tab label="7 Days" onClick={() => setTimeRange('7d')} />
       <Tab label="30 Days" onClick={() => setTimeRange('30d')} />
       <Tab label="90 Days" onClick={() => setTimeRange('90d')} />
      </Tabs>
     }
    />
    <CardContent>
     {healthMetrics && (
      <Box sx={{ height: 400 }}>
       <Line 
        data={createTrendChart()!}
        options={{
         responsive: true,
         maintainAspectRatio: false,
         plugins: {
          legend: {
           position: 'top'
          },
          title: {
           display: true,
           text: `Building Health Trends - Last ${timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : '90 Days'}`
          }
         },
         scales: {
          y: {
           beginAtZero: true,
           max: 100,
           title: {
            display: true,
            text: 'Health Score (%)'
           }
          }
         }
        }}
       />
      </Box>
     )}
    </CardContent>
   </Card>
  </Container>
 );
};

export default BuildingHealthMonitorScreen;
