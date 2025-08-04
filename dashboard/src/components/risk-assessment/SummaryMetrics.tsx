import React from 'react';
import {
 Card,
 CardContent,
 Typography,
 Grid,
 Box,
 Chip,
 IconButton,
 Skeleton,
} from '@mui/material';
import {
 People as PeopleIcon,
 Assessment as AssessmentIcon,
 TrendingUp as TrendingUpIcon,
 Refresh as RefreshIcon,
} from '@mui/icons-material';
import { SummaryMetricsProps, RiskLevel } from '../../types/risk-assessment';

/**
 * Summary metrics cards for risk assessment dashboard
 * Displays key metrics including total applicants and risk categories
 */
export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
 metrics,
 loading = false,
 onRefresh,
}) => {
 const getRiskLevelColor = (level: RiskLevel): 'success' | 'warning' | 'error' => {
  switch (level) {
   case 'low':
    return 'success';
   case 'medium':
    return 'warning';
   case 'high':
    return 'error';
   default:
    return 'success';
  }
 };

 const formatLastUpdated = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
 };

 if (loading) {
  return (
   <Grid container spacing={3}>
    {[1, 2, 3, 4].map((index) => (
     <Grid xs={12} sm={6} md={3} key={index}>
      <Card>
       <CardContent>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="80%" height={20} />
       </CardContent>
      </Card>
     </Grid>
    ))}
   </Grid>
  );
 }

 return (
  <Box>
   <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
    <Typography variant="h5" component="h2">
     Risk Assessment Overview
    </Typography>
    <Box display="flex" alignItems="center" gap={1}>
     <Typography variant="body2" color="text.secondary">
      Last updated: {formatLastUpdated(metrics.lastUpdated)}
     </Typography>
     {onRefresh && (
      <IconButton
       onClick={onRefresh}
       size="small"
       aria-label="Refresh metrics"
      >
       <RefreshIcon />
      </IconButton>
     )}
    </Box>
   </Box>

   <Grid container spacing={3}>
    {/* Total Applicants */}
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Box display="flex" alignItems="center" mb={2}>
        <PeopleIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="h3">
         Total Applicants
        </Typography>
       </Box>
       <Typography variant="h3" component="div" color="primary">
        {metrics.totalApplicants}
       </Typography>
       <Typography variant="body2" color="text.secondary">
        Active applications
       </Typography>
      </CardContent>
     </Card>
    </Grid>

    {/* Average Risk Score */}
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Box display="flex" alignItems="center" mb={2}>
        <AssessmentIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="h3">
         Average Score
        </Typography>
       </Box>
       <Typography variant="h3" component="div" color="primary">
        {metrics.averageScore.toFixed(1)}
       </Typography>
       <Typography variant="body2" color="text.secondary">
        Out of 100
       </Typography>
      </CardContent>
     </Card>
    </Grid>

    {/* Pending Reviews */}
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Box display="flex" alignItems="center" mb={2}>
        <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="h3">
         Pending Reviews
        </Typography>
       </Box>
       <Typography variant="h3" component="div" color="primary">
        {metrics.pendingReviews}
       </Typography>
       <Typography variant="body2" color="text.secondary">
        Awaiting review
       </Typography>
      </CardContent>
     </Card>
    </Grid>

    {/* Risk Categories */}
    <Grid xs={12} sm={6} md={3}>
     <Card>
      <CardContent>
       <Typography variant="h6" component="h3" mb={2}>
        Risk Categories
       </Typography>
       <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
         <Chip
          label="Low Risk"
          color={getRiskLevelColor('low')}
          size="small"
          variant="outlined"
         />
         <Typography variant="body2" fontWeight="bold">
          {metrics.riskCategories.low}
         </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
         <Chip
          label="Medium Risk"
          color={getRiskLevelColor('medium')}
          size="small"
          variant="outlined"
         />
         <Typography variant="body2" fontWeight="bold">
          {metrics.riskCategories.medium}
         </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
         <Chip
          label="High Risk"
          color={getRiskLevelColor('high')}
          size="small"
          variant="outlined"
         />
         <Typography variant="body2" fontWeight="bold">
          {metrics.riskCategories.high}
         </Typography>
        </Box>
       </Box>
      </CardContent>
     </Card>
    </Grid>
   </Grid>
  </Box>
 );
};

export default SummaryMetrics;