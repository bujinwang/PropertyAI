import React from 'react';
import {
 Grid,
 Card,
 CardContent,
 Typography,
 Box,
 LinearProgress,
} from '@mui/material';
import {
 BugReport as BugReportIcon,
 AccessTime as AccessTimeIcon,
 CheckCircle as CheckCircleIcon,
 TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface UXReviewStatsData {
 totalReviews: number;
 openReviews: number;
 inProgressReviews: number;
 resolvedReviews: number;
 severityStats: Array<{ severity: string; _count: { _all: number } }>;
 priorityStats: Array<{ priority: string; _count: { _all: number } }>;
 typeStats: Array<{ reviewType: string; _count: { _all: number } }>;
}

interface UXReviewStatsProps {
 stats: UXReviewStatsData;
}

export const UXReviewStats: React.FC<UXReviewStatsProps> = ({ stats }) => {
 const getSeverityColor = (severity: string) => {
  switch (severity) {
   case 'CRITICAL': return '#d32f2f'; // Enhanced contrast from #f44336
   case 'HIGH': return '#f57c00';  // Enhanced contrast from #ff9800
   case 'MEDIUM': return '#1976d2'; // Enhanced contrast from #2196f3
   case 'LOW': return '#388e3c';   // Enhanced contrast from #4caf50
   default: return '#757575';    // Enhanced contrast from #9e9e9e
  }
 };

 const getPriorityColor = (priority: string) => {
  switch (priority) {
   case 'URGENT': return '#d32f2f';
   case 'HIGH': return '#f57c00';
   case 'MEDIUM': return '#1976d2';
   case 'LOW': return '#388e3c';
   default: return '#757575';
  }
 };

 const getSeverityIcon = (severity: string) => {
  switch (severity) {
   case 'CRITICAL': return '⚠️';
   case 'HIGH': return '🔶';
   case 'MEDIUM': return '🔷';
   case 'LOW': return '✅';
   default: return '⚪';
  }
 };

 const completionRate = stats.totalReviews > 0 
  ? ((stats.resolvedReviews / stats.totalReviews) * 100).toFixed(1)
  : '0';

 return (
  <Grid container spacing={3} mb={3}>
   {/* Main Stats */}
   <Grid xs={12} sm={6} md={3}>
    <Card sx={{ height: '100%' }}>
     <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
       <BugReportIcon color="primary" sx={{ mr: 1 }} />
       <Typography variant="h6">Total Reviews</Typography>
      </Box>
      <Typography variant="h3" component="div">
       {stats.totalReviews}
      </Typography>
      <Typography variant="body2" color="text.secondary">
       All time
      </Typography>
     </CardContent>
    </Card>
   </Grid>

   <Grid xs={12} sm={6} md={3}>
    <Card sx={{ height: '100%' }}>
     <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
       <BugReportIcon color="error" sx={{ mr: 1 }} />
       <Typography variant="h6">Open Reviews</Typography>
      </Box>
      <Typography variant="h3" component="div">
       {stats.openReviews}
      </Typography>
      <Typography variant="body2" color="text.secondary">
       Needs attention
      </Typography>
     </CardContent>
    </Card>
   </Grid>

   <Grid xs={12} sm={6} md={3}>
    <Card sx={{ height: '100%' }}>
     <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
       <AccessTimeIcon color="warning" sx={{ mr: 1 }} />
       <Typography variant="h6">In Progress</Typography>
      </Box>
      <Typography variant="h3" component="div">
       {stats.inProgressReviews}
      </Typography>
      <Typography variant="body2" color="text.secondary">
       Being worked on
      </Typography>
     </CardContent>
    </Card>
   </Grid>

   <Grid xs={12} sm={6} md={3}>
    <Card sx={{ height: '100%' }}>
     <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
       <CheckCircleIcon color="success" sx={{ mr: 1 }} />
       <Typography variant="h6">Completed</Typography>
      </Box>
      <Typography variant="h3" component="div">
       {stats.resolvedReviews}
      </Typography>
      <Typography variant="body2" color="text.secondary">
       {completionRate}% completion rate
      </Typography>
     </CardContent>
    </Card>
   </Grid>

   {/* Severity Distribution */}
   <Grid xs={12} md={6}>
    <Card>
     <CardContent>
      <Typography variant="h6" gutterBottom>
       Severity Distribution
      </Typography>
      <Box mt={2}>
       {stats.severityStats.map((stat) => (
        <Box key={stat.severity} mb={2}>
         <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2">{stat.severity}</Typography>
          <Typography variant="body2">{stat._count._all}</Typography>
         </Box>
         <LinearProgress
          variant="determinate"
          value={(stat._count._all / stats.totalReviews) * 100}
          sx={{
           height: 8,
           borderRadius: 1,
           backgroundColor: '#f5f5f5',
           '& .MuiLinearProgress-bar': {
            backgroundColor: getSeverityColor(stat.severity),
           },
          }}
         />
        </Box>
       ))}
      </Box>
     </CardContent>
    </Card>
   </Grid>

   {/* Priority Distribution */}
   <Grid xs={12} md={6}>
    <Card>
     <CardContent>
      <Typography variant="h6" gutterBottom>
       Priority Distribution
      </Typography>
      <Box mt={2}>
       {stats.priorityStats.map((stat) => (
        <Box key={stat.priority} mb={2}>
         <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2">{stat.priority}</Typography>
          <Typography variant="body2">{stat._count._all}</Typography>
         </Box>
         <LinearProgress
          variant="determinate"
          value={(stat._count._all / stats.totalReviews) * 100}
          sx={{
           height: 8,
           borderRadius: 1,
           backgroundColor: '#f5f5f5',
           '& .MuiLinearProgress-bar': {
            backgroundColor: getPriorityColor(stat.priority),
           },
          }}
         />
        </Box>
       ))}
      </Box>
     </CardContent>
    </Card>
   </Grid>

   {/* Review Type Distribution */}
   <Grid xs={12}>
    <Card>
     <CardContent>
      <Typography variant="h6" gutterBottom>
       Review Types
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
       {stats.typeStats.map((stat) => (
        <Box
         key={stat.reviewType}
         sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          minWidth: 120,
         }}
        >
         <TrendingUpIcon fontSize="small" color="action" />
         <Box>
          <Typography variant="body2" fontWeight="medium">
           {stat.reviewType}
          </Typography>
          <Typography variant="caption" color="text.secondary">
           {stat._count._all} reviews
          </Typography>
         </Box>
        </Box>
       ))}
      </Box>
     </CardContent>
    </Card>
   </Grid>
  </Grid>
 );
};