import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  Chip, 
  Box, 
  IconButton, 
  Popover, 
  TextField, 
  Button, 
  Typography,
  Divider
} from '@mui/material';
import { 
  WbIncandescent, 
  ThumbUp, 
  ThumbDown, 
  Feedback 
} from '@mui/icons-material';
import { SuggestionChipProps, AIFeedback } from '../../../types/ai';

const SuggestionChip: React.FC<SuggestionChipProps> = memo(({ 
  label,
  confidence,
  onFeedback,
  showFeedback = false,
  variant = 'outlined',
  size = 'medium',
  ...props 
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleFeedbackClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleFeedbackClose = useCallback(() => {
    setAnchorEl(null);
    setFeedbackComment('');
  }, []);

  const handleSubmitFeedback = useCallback(async (type: 'positive' | 'negative') => {
    const feedback: AIFeedback = {
      type,
      comment: feedbackComment.trim() || undefined,
      timestamp: new Date(),
    };
    
    try {
      // Call the feedback handler which should handle API integration
      await onFeedback?.(feedback);
      setSubmittedFeedback(type);
      handleFeedbackClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Could add error state handling here
    }
  }, [feedbackComment, onFeedback, handleFeedbackClose]);

  const open = Boolean(anchorEl);

  const chipColor = useMemo(() => {
    if (submittedFeedback === 'positive') return 'success';
    if (submittedFeedback === 'negative') return 'error';
    return 'primary';
  }, [submittedFeedback]);

  const chipLabel = useMemo(() => {
    let baseLabel = label;
    
    if (confidence !== undefined) {
      baseLabel += ` (${Math.round(confidence)}%)`;
    }
    
    if (submittedFeedback) {
      baseLabel += submittedFeedback === 'positive' ? ' ✓' : ' ✗';
    }
    
    return baseLabel;
  }, [label, confidence, submittedFeedback]);

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Chip 
        icon={<WbIncandescent />} 
        label={chipLabel}
        variant={variant}
        color={chipColor}
        size={size}
        {...props} 
      />
      
      {showFeedback && onFeedback && !submittedFeedback && (
        <>
          <IconButton
            size="small"
            onClick={() => handleSubmitFeedback('positive')}
            sx={{ ml: 0.5 }}
            aria-label="Mark as helpful"
            color="success"
          >
            <ThumbUp fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleSubmitFeedback('negative')}
            sx={{ ml: 0.5 }}
            aria-label="Mark as not helpful"
            color="error"
          >
            <ThumbDown fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleFeedbackClick}
            sx={{ ml: 0.5 }}
            aria-label="Provide detailed feedback"
          >
            <Feedback fontSize="small" />
          </IconButton>
          
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleFeedbackClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <Box sx={{ p: 2, minWidth: 280 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                How helpful was this suggestion?
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<ThumbUp />}
                  onClick={() => handleSubmitFeedback('positive')}
                  color="success"
                  size="small"
                >
                  Helpful
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ThumbDown />}
                  onClick={() => handleSubmitFeedback('negative')}
                  color="error"
                  size="small"
                >
                  Not Helpful
                </Button>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Additional feedback (optional):
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Tell us more..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                sx={{ mb: 1 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button size="small" onClick={handleFeedbackClose}>
                  Cancel
                </Button>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => handleSubmitFeedback('positive')}
                  disabled={!feedbackComment.trim()}
                >
                  Submit
                </Button>
              </Box>
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
});

SuggestionChip.displayName = 'SuggestionChip';

export default SuggestionChip;
