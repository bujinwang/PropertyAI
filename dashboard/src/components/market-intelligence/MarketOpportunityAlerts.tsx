/**
 * Market Opportunity Alerts Component
 * Displays AI-identified market opportunities with actionable recommendations
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
 ListItemIcon,
 ListItemText,
 Button,
 IconButton,
 Collapse,
 Alert,
 LinearProgress,
 Tooltip,
 Dialog,
 DialogTitle,
 DialogContent,
 DialogActions,
 TextField,
} from '@mui/material';
import {
 TrendingUp,
 Schedule,
 AttachMoney,
 CheckCircle,
 ExpandMore,
 ExpandLess,
 Lightbulb,
 Warning,
 Info,
 Close,
 PlayArrow,
 Bookmark,
 Share,
} from '@mui/icons-material';
// Change from:
import { AIGeneratedContent } from '../../design-system/components/ai/AIGeneratedContent';
import { ConfidenceIndicator } from '../../design-system/components/ai/ConfidenceIndicator';
import { ExplanationTooltip } from '../../design-system/components/ai/ExplanationTooltip';

// To:
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import ExplanationTooltip from '../../design-system/components/ai/ExplanationTooltip';
import { MarketOpportunity } from '../../types/market-intelligence';
import { AIFeedback } from '../../types/ai';

interface MarketOpportunityAlertsProps {
 opportunities: MarketOpportunity[];
 onOpportunityAction?: (opportunity: MarketOpportunity, action: string) => void;
 onFeedback?: (feedback: AIFeedback) => void;
 loading?: boolean;
}

const MarketOpportunityAlerts: React.FC<MarketOpportunityAlertsProps> = ({
 opportunities,
 onOpportunityAction,
 onFeedback,
 loading = false,
}) => {
 const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null);
 const [actionDialogOpen, setActionDialogOpen] = useState(false);
 const [selectedOpportunity, setSelectedOpportunity] = useState<MarketOpportunity | null>(null);
 const [actionNotes, setActionNotes] = useState('');

 const getPriorityColor = (priority: string) => {
  switch (priority) {
   case 'critical':
    return 'error';
   case 'high':
    return 'warning';
   case 'medium':
    return 'info';
   default:
    return 'default';
  }
 };

 const getPriorityIcon = (priority: string) => {
  switch (priority) {
   case 'critical':
    return <Warning color="error" />;
   case 'high':
    return <TrendingUp color="warning" />;
   case 'medium':
    return <Info color="info" />;
   default:
    return <Lightbulb />;
  }
 };

 const getTypeIcon = (type: string) => {
  switch (type) {
   case 'pricing':
    return <AttachMoney />;
   case 'amenity':
    return <CheckCircle />;
   case 'location':
    return <TrendingUp />;
   case 'timing':
    return <Schedule />;
   default:
    return <Lightbulb />;
  }
 };

 const handleExpandOpportunity = (opportunityId: string) => {
  setExpandedOpportunity(
   expandedOpportunity === opportunityId ? null : opportunityId
  );
 };

 const handleActionClick = (opportunity: MarketOpportunity, action: string) => {
  if (action === 'implement') {
   setSelectedOpportunity(opportunity);
   setActionDialogOpen(true);
  } else {
   if (onOpportunityAction) {
    onOpportunityAction(opportunity, action);
   }
  }
 };

 const handleImplementAction = () => {
  if (selectedOpportunity && onOpportunityAction) {
   onOpportunityAction(selectedOpportunity, 'implement');
  }
  setActionDialogOpen(false);
  setSelectedOpportunity(null);
  setActionNotes('');
 };

 const handleCloseActionDialog = () => {
  setActionDialogOpen(false);
  setSelectedOpportunity(null);
  setActionNotes('');
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

 const sortedOpportunities = [...opportunities].sort((a, b) => {
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return priorityOrder[b.priority as keyof typeof priorityOrder] - 
      priorityOrder[a.priority as keyof typeof priorityOrder];
 });

 if (loading) {
  return (
   <Card>
    <CardHeader title="Market Opportunities" />
    <CardContent>
     <Box display="flex" justifyContent="center" p={4}>
      <Typography color="textSecondary">Analyzing market opportunities...</Typography>
     </Box>
    </CardContent>
   </Card>
  );
 }

 return (
  <AIGeneratedContent
   confidence={82}
   explanation="Market opportunities identified through AI analysis of market trends, competitor gaps, and demand patterns"
   onFeedback={handleFeedback}
   variant="outlined"
  >
   <Card elevation={2}>
    <CardHeader
     title="Market Opportunities"
     subheader={`${opportunities.length} opportunities identified with potential ROI insights`}
     action={
      <Box display="flex" gap={1}>
       {['critical', 'high', 'medium', 'low'].map((priority) => {
        const count = opportunities.filter(op => op.priority === priority).length;
        return count > 0 ? (
         <Chip
          key={priority}
          label={`${priority}: ${count}`}
          color={getPriorityColor(priority) as any}
          size="small"
          variant="outlined"
         />
        ) : null;
       })}
      </Box>
     }
    />
    <CardContent>
     <Grid container spacing={2}>
      {sortedOpportunities.map((opportunity) => (
       <Grid xs={12} key={opportunity.id}>
        <Card 
         variant="outlined"
         sx={{ 
          border: opportunity.priority === 'critical' ? '2px solid' : '1px solid',
          borderColor: opportunity.priority === 'critical' ? 'error.main' : 'divider'
         }}
        >
         <CardContent>
          {/* Opportunity Header */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
           {getPriorityIcon(opportunity.priority)}
           <Box flex={1}>
            <Typography variant="h6" component="h3">
             {opportunity.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
             <Chip
              label={opportunity.priority}
              color={getPriorityColor(opportunity.priority) as any}
              size="small"
             />
             <Chip
              icon={getTypeIcon(opportunity.type)}
              label={opportunity.type}
              variant="outlined"
              size="small"
             />
             <Chip
              label={opportunity.timeline}
              variant="outlined"
              size="small"
             />
             {opportunity.estimatedROI && (
              <Chip
               label={`ROI: ${opportunity.estimatedROI}%`}
               color="success"
               variant="outlined"
               size="small"
              />
             )}
            </Box>
           </Box>
           <ConfidenceIndicator
            confidence={opportunity.confidence.value}
            showTooltip
            explanation={opportunity.confidence.explanation}
            variant="circular"
            size="medium"
            colorCoded
            showNumericalScore
           />
           <IconButton
            onClick={() => handleExpandOpportunity(opportunity.id)}
            size="small"
           >
            {expandedOpportunity === opportunity.id ? <ExpandLess /> : <ExpandMore />}
           </IconButton>
          </Box>

          {/* Opportunity Description */}
          <Typography variant="body2" color="textSecondary" paragraph>
           {opportunity.description}
          </Typography>

          {/* Potential Impact */}
          <Alert 
           severity="info" 
           sx={{ mb: 2 }}
           icon={<TrendingUp />}
          >
           <Typography variant="body2">
            <strong>Potential Impact:</strong> {opportunity.potentialImpact}
           </Typography>
          </Alert>

          {/* Action Buttons */}
          <Box display="flex" gap={1} mb={2}>
           <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PlayArrow />}
            onClick={() => handleActionClick(opportunity, 'implement')}
           >
            Implement
           </Button>
           <Button
            variant="outlined"
            size="small"
            startIcon={<Bookmark />}
            onClick={() => handleActionClick(opportunity, 'save')}
           >
            Save for Later
           </Button>
           <Button
            variant="outlined"
            size="small"
            startIcon={<Share />}
            onClick={() => handleActionClick(opportunity, 'share')}
           >
            Share
           </Button>
          </Box>

          {/* Expandable Details */}
          <Collapse in={expandedOpportunity === opportunity.id}>
           <Box pt={2} borderTop={1} borderColor="divider">
            <Typography variant="h6" gutterBottom>
             Action Items
            </Typography>
            <List dense>
             {opportunity.actionItems.map((item, index) => (
              <ListItem key={index} disableGutters>
               <ListItemIcon>
                <CheckCircle color="primary" fontSize="small" />
               </ListItemIcon>
               <ListItemText primary={item} />
              </ListItem>
             ))}
            </List>

            {opportunity.estimatedROI && (
             <Box mt={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
               ROI Projection
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
               <LinearProgress
                variant="determinate"
                value={Math.min(opportunity.estimatedROI, 100)}
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
                color="success"
               />
               <Typography variant="body2" fontWeight="medium">
                {opportunity.estimatedROI}%
               </Typography>
              </Box>
             </Box>
            )}

            <Box mt={2}>
             <ExplanationTooltip
              title="How was this opportunity identified?"
              content={opportunity.confidence.explanation || 'AI analysis of market data, competitor gaps, and demand patterns'}
              placement="top"
             >
              <Button variant="text" size="small" color="primary">
               View analysis details
              </Button>
             </ExplanationTooltip>
            </Box>
           </Box>
          </Collapse>
         </CardContent>
        </Card>
       </Grid>
      ))}
     </Grid>
    </CardContent>
   </Card>

   {/* Implementation Action Dialog */}
   <Dialog
    open={actionDialogOpen}
    onClose={handleCloseActionDialog}
    maxWidth="sm"
    fullWidth
   >
    {selectedOpportunity && (
     <>
      <DialogTitle>
       <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">
         Implement: {selectedOpportunity.title}
        </Typography>
        <IconButton onClick={handleCloseActionDialog}>
         <Close />
        </IconButton>
       </Box>
      </DialogTitle>
      <DialogContent>
       <Typography variant="body2" color="textSecondary" paragraph>
        You're about to implement this market opportunity. Add any notes or specific considerations:
       </Typography>
       
       <TextField
        fullWidth
        multiline
        rows={4}
        label="Implementation Notes"
        value={actionNotes}
        onChange={(e) => setActionNotes(e.target.value)}
        placeholder="Add specific implementation details, timeline adjustments, or team assignments..."
        sx={{ mb: 2 }}
       />

       <Alert severity="info">
        <Typography variant="body2">
         <strong>Timeline:</strong> {selectedOpportunity.timeline}<br />
         <strong>Expected ROI:</strong> {selectedOpportunity.estimatedROI}%<br />
         <strong>Priority:</strong> {selectedOpportunity.priority}
        </Typography>
       </Alert>
      </DialogContent>
      <DialogActions>
       <Button onClick={handleCloseActionDialog}>Cancel</Button>
       <Button 
        onClick={handleImplementAction}
        variant="contained"
        color="primary"
       >
        Start Implementation
       </Button>
      </DialogActions>
     </>
    )}
   </Dialog>
  </AIGeneratedContent>
 );
};

export default MarketOpportunityAlerts;