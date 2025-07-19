/**
 * Recommendation Card Component
 * Individual card for displaying personalized recommendations
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,

} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Info,

  Schedule,
  OpenInNew,
} from '@mui/icons-material';
import { RecommendationCardProps } from '../../types/personalization';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onExplanationRequest,
  onFeedback,
  onCtaClick,
  showPersonalizationLabel = true,
  compact = false,
}) => {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative'>('positive');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false);

  const handleFeedbackClick = (type: 'positive' | 'negative') => {
    setFeedbackType(type);
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = () => {
    onFeedback(item.id, feedbackType, feedbackComment.trim() || undefined);
    setHasGivenFeedback(true);
    setFeedbackDialogOpen(false);
    setFeedbackComment('');
  };

  const handleCtaClick = () => {
    onCtaClick(item.id, item.ctaUrl);
  };

  const handleExplanationClick = () => {
    onExplanationRequest(item.id);
  };

  const isExpired = item.expiresAt && new Date() > item.expiresAt;
  const isExpiringSoon = item.expiresAt && 
    new Date(item.expiresAt.getTime() - 24 * 60 * 60 * 1000) < new Date();

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity: isExpired ? 0.6 : 1,
          position: 'relative',
        }}
      >
        {/* Personalization Label */}
        {showPersonalizationLabel && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
            }}
          >
            <Chip
              label="For You"
              size="small"
              color="primary"
              variant="filled"
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem',
              }}
            />
          </Box>
        )}

        {/* Expiration Warning */}
        {isExpiringSoon && !isExpired && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <Chip
              icon={<Schedule />}
              label="Expires Soon"
              size="small"
              color="warning"
              variant="filled"
            />
          </Box>
        )}

        {/* Card Image */}
        {item.imageUrl && (
          <CardMedia
            component="img"
            height={compact ? 120 : 160}
            image={item.imageUrl}
            alt={item.title}
            sx={{
              objectFit: 'cover',
            }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <AIGeneratedContent
            confidence={item.confidence}
            explanation={item.explanation}
            variant="outlined"
            showLabel={false}
          >
            <Typography 
              gutterBottom 
              variant={compact ? "subtitle2" : "h6"} 
              component="h3"
              sx={{ 
                fontWeight: 'bold',
                lineHeight: 1.2,
                mb: 1,
              }}
            >
              {item.title}
            </Typography>

            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: compact ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.description}
            </Typography>
          </AIGeneratedContent>

          {/* Tags */}
          <Box sx={{ mb: 2 }}>
            {item.tags.slice(0, compact ? 2 : 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
              />
            ))}
          </Box>

          {/* Confidence Indicator */}
          <Box sx={{ mb: 1 }}>
            <ConfidenceIndicator
              confidence={item.confidence}
              showTooltip={true}
              explanation={`AI confidence: ${item.confidence}% - ${item.reasoning}`}
              variant="linear"
              size="small"
              colorCoded={true}
              showNumericalScore={true}
            />
          </Box>
        </CardContent>

        <CardActions 
          sx={{ 
            justifyContent: 'space-between', 
            px: 2, 
            pb: 2,
            pt: 0,
          }}
        >
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCtaClick}
              disabled={isExpired}
              endIcon={<OpenInNew />}
              size={compact ? "small" : "medium"}
            >
              {item.ctaText}
            </Button>
          </Box>

          <Box>
            {/* Explanation Button */}
            <Tooltip title="Why am I seeing this?">
              <IconButton
                size="small"
                onClick={handleExplanationClick}
                sx={{ mr: 1 }}
              >
                <Info />
              </IconButton>
            </Tooltip>

            {/* Feedback Buttons */}
            {!hasGivenFeedback && (
              <>
                <Tooltip title="This is helpful">
                  <IconButton
                    size="small"
                    onClick={() => handleFeedbackClick('positive')}
                    color="success"
                  >
                    <ThumbUp />
                  </IconButton>
                </Tooltip>
                <Tooltip title="This is not helpful">
                  <IconButton
                    size="small"
                    onClick={() => handleFeedbackClick('negative')}
                    color="error"
                  >
                    <ThumbDown />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {hasGivenFeedback && (
              <Chip
                label="Feedback sent"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </CardActions>
      </Card>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {feedbackType === 'positive' ? 'Great! Tell us more' : 'Help us improve'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your feedback helps us provide better recommendations.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Additional comments (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder={
              feedbackType === 'positive' 
                ? "What did you like about this recommendation?"
                : "How can we improve our recommendations?"
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleFeedbackSubmit} variant="contained">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecommendationCard;