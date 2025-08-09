/**
 * Competitor Activity Analysis Component
 * Displays competitor data and recent activity with AI insights
 */

import React, { useState } from 'react';
import {
 Card,
 CardContent,
 CardHeader,
 Typography,
 Box,
 Grid,
 Chip,
 List,
 ListItem,
 ListItemText,
 Avatar,
 IconButton,
 Tooltip,
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 Button,
 Divider,
 LinearProgress,
} from '@mui/material';
import {
 TrendingUp,
 TrendingDown,
 Info,
 LocationOn,
 Business,
 People,
 AttachMoney,
 Timeline,
 Close,
} from '@mui/icons-material';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import { CompetitorData, CompetitorActivity } from '../../types/market-intelligence';
import { AIFeedback } from '../../types/ai';

interface CompetitorActivityAnalysisProps {
 competitors: CompetitorData[];
 onCompetitorSelect?: (competitor: CompetitorData) => void;
 onFeedback?: (feedback: AIFeedback) => void;
 loading?: boolean;
}

const CompetitorActivityAnalysis: React.FC<CompetitorActivityAnalysisProps> = ({
 competitors,
 onCompetitorSelect,
 onFeedback,
 loading = false,
}) => {
 const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorData | null>(null);
 const [detailDialogOpen, setDetailDialogOpen] = useState(false);

 const getActivityIcon = (type: CompetitorActivity['type']) => {
  switch (type) {
   case 'price_change':
    return <AttachMoney />;
   case 'new_listing':
    return <Business />;
   case 'promotion':
    return <TrendingUp />;
   case 'renovation':
    return <Timeline />;
   default:
    return <Info />;
  }
 };

 const getActivityColor = (impact: CompetitorActivity['impact']) => {
  switch (impact) {
   case 'positive':
    return 'success';
   case 'negative':
    return 'error';
   default:
    return 'default';
  }
 };

 const getImpactIcon = (impact: CompetitorActivity['impact']) => {
  switch (impact) {
   case 'positive':
    return <TrendingUp color="success" />;
   case 'negative':
    return <TrendingDown color="error" />;
   default:
    return <TrendingUp color="disabled" />;
  }
 };

 const handleCompetitorClick = (competitor: CompetitorData) => {
  setSelectedCompetitor(competitor);
  setDetailDialogOpen(true);
  if (onCompetitorSelect) {
   onCompetitorSelect(competitor);
  }
 };

 const handleCloseDialog = () => {
  setDetailDialogOpen(false);
  setSelectedCompetitor(null);
 };

 const formatRentRange = (range: [number, number] | undefined) => {
  if (!range || !Array.isArray(range) || range.length < 2) {
   return 'Range not available';
  }
  return `$${(range[0] || 0).toLocaleString()} - $${(range[1] || 0).toLocaleString()}`;
 };

 const handleFeedback = (type: 'positive' | 'negative', comment?: string) => {
  if (onFeedback) {
   onFeedback({
    type,
    comment,
    timestamp: new Date(),
   });
  }
 };

 if (loading) {
  return (
   <Card>
    <CardHeader title="Competitor Activity Analysis" />
    <CardContent>
     <Box display="flex" justifyContent="center" p={4}>
      <Typography color="textSecondary">Loading competitor data...</Typography>
     </Box>
    </CardContent>
   </Card>
  );
 }

 return (
  <AIGeneratedContent
   confidence={85}
   explanation="Competitor analysis based on public data, market intelligence, and AI-powered activity tracking"
   onFeedback={handleFeedback}
   variant="outlined"
  >
   <Card elevation={2}>
    <CardHeader
     title="Competitor Activity Analysis"
     subheader={`Tracking ${competitors?.length || 0} key competitors in your market area`}
    />
    <CardContent>
     <Grid container spacing={3}>
      {competitors.map((competitor) => (
       <Grid size={6} key={competitor.id}>
        <Card
         variant="outlined"
         sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
           transform: 'translateY(-2px)',
           boxShadow: 2,
          },
         }}
         onClick={() => handleCompetitorClick(competitor)}
        >
         <CardContent>
          {/* Competitor Header */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
           <Avatar sx={{ bgcolor: 'primary.main' }}>
            {competitor.name.charAt(0)}
           </Avatar>
           <Box flex={1}>
            <Typography variant="h6" noWrap>
             {competitor.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
             <LocationOn fontSize="small" />
             {competitor.address}
            </Typography>
           </Box>
           <Chip
            label={`${competitor.marketShare}%`}
            size="small"
            color="primary"
            variant="outlined"
           />
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={2} mb={2}>
           <Grid xs={6}>
            <Box textAlign="center">
             <Typography variant="h6" color="primary">
              {competitor.occupancyRate}%
             </Typography>
             <Typography variant="caption" color="textSecondary">
              Occupancy
             </Typography>
            </Box>
           </Grid>
           <Grid xs={6}>
            <Box textAlign="center">
             <Typography variant="h6" color="primary">
              {competitor.units}
             </Typography>
             <Typography variant="caption" color="textSecondary">
              Units
             </Typography>
            </Box>
           </Grid>
          </Grid>

          {/* Rent Range */}
          <Box mb={2}>
           <Typography variant="body2" color="textSecondary">
            Rent Range
           </Typography>
           <Typography variant="body1" fontWeight="medium">
            {formatRentRange(competitor.rentRange)}
           </Typography>
          </Box>

          {/* Recent Activity */}
          <Box>
           <Typography variant="body2" color="textSecondary" mb={1}>
            Recent Activity ({Array.isArray(competitor.recentActivity) ? competitor.recentActivity.length : 0})
           </Typography>
           {Array.isArray(competitor.recentActivity) && competitor.recentActivity.slice(0, 2).map((activity) => (
            <Box key={activity.id} display="flex" alignItems="center" gap={1} mb={1}>
             {getActivityIcon(activity.type)}
             <Typography variant="body2" flex={1} noWrap>
              {activity.description}
             </Typography>
             {getImpactIcon(activity.impact)}
            </Box>
           ))}
           {Array.isArray(competitor.recentActivity) && competitor.recentActivity.length > 2 && (
            <Typography variant="caption" color="primary">
             +{competitor.recentActivity.length - 2} more activities
            </Typography>
           )}
          </Box>

          {/* Amenities Preview */}
          <Box mt={2}>
           <Typography variant="body2" color="textSecondary" mb={1}>
            Key Amenities
           </Typography>
           <Box display="flex" gap={0.5} flexWrap="wrap">
            {Array.isArray(competitor.amenities) && competitor.amenities.slice(0, 3).map((amenity) => (
             <Chip
              key={amenity}
              label={amenity}
              size="small"
              variant="outlined"
             />
            ))}
            {Array.isArray(competitor.amenities) && competitor.amenities.length > 3 && (
             <Chip
              label={`+${competitor.amenities.length - 3}`}
              size="small"
              variant="outlined"
              color="primary"
             />
            )}
           </Box>
          </Box>
         </CardContent>
        </Card>
       </Grid>
      ))}
     </Grid>
    </CardContent>
   </Card>

   {/* Competitor Detail Dialog */}
   <Dialog
    open={detailDialogOpen}
    onClose={handleCloseDialog}
    maxWidth="md"
    fullWidth
   >
    {selectedCompetitor && (
     <>
      <DialogTitle>
       <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
         <Avatar sx={{ bgcolor: 'primary.main' }}>
          {selectedCompetitor.name.charAt(0)}
         </Avatar>
         <Box>
          <Typography variant="h6">
           {selectedCompetitor.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
           {selectedCompetitor.propertyType}
          </Typography>
         </Box>
        </Box>
        <IconButton onClick={handleCloseDialog}>
         <Close />
        </IconButton>
       </Box>
      </DialogTitle>
      <DialogContent>
       {/* Detailed Metrics */}
       <Grid container spacing={3} mb={3}>
        <Grid size={3}>
         <Box textAlign="center">
          <Typography variant="h5" color="primary">
           {selectedCompetitor.occupancyRate}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
           Occupancy Rate
          </Typography>
         </Box>
        </Grid>
        <Grid size={3}>
         <Box textAlign="center">
          <Typography variant="h5" color="primary">
           {selectedCompetitor.units}
          </Typography>
          <Typography variant="body2" color="textSecondary">
           Total Units
          </Typography>
         </Box>
        </Grid>
        <Grid size={3}>
         <Box textAlign="center">
          <Typography variant="h5" color="primary">
           {selectedCompetitor.marketShare}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
           Market Share
          </Typography>
         </Box>
        </Grid>
        <Grid size={3}>
         <Box textAlign="center">
          <Typography variant="h5" color="primary">
           {formatRentRange(selectedCompetitor.rentRange)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
           Rent Range
          </Typography>
         </Box>
        </Grid>
       </Grid>

       <Divider sx={{ my: 2 }} />

       {/* All Amenities */}
       <Box mb={3}>
        <Typography variant="h6" gutterBottom>
         Amenities
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
         {Array.isArray(selectedCompetitor.amenities) && selectedCompetitor.amenities.map((amenity) => (
          <Chip
           key={amenity}
           label={amenity}
           variant="outlined"
           size="small"
          />
         ))}
        </Box>
       </Box>

       {/* Complete Activity History */}
       <Box>
        <Typography variant="h6" gutterBottom>
         Activity History
        </Typography>
        <List>
         {Array.isArray(selectedCompetitor.recentActivity) && selectedCompetitor.recentActivity.map((activity) => (
          <ListItem key={activity.id} divider>
           <Box display="flex" alignItems="center" gap={2} width="100%">
            {getActivityIcon(activity.type)}
            <Box flex={1}>
             <ListItemText
              primary={activity.description}
              secondary={activity.date.toLocaleDateString()}
             />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
             <ConfidenceIndicator
              confidence={activity.confidence}
              variant="circular"
              size="small"
              colorCoded
             />
             <Chip
              label={activity.impact}
              color={getActivityColor(activity.impact) as any}
              size="small"
             />
            </Box>
           </Box>
          </ListItem>
         ))}
        </List>
       </Box>
      </DialogContent>
      <DialogActions>
       <Button onClick={handleCloseDialog}>Close</Button>
      </DialogActions>
     </>
    )}
   </Dialog>
  </AIGeneratedContent>
 );
};

export default CompetitorActivityAnalysis;