import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
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
import { 
  useDebouncedAIFeedback, 
  useAIPerformanceMonitor,
  useCachedAICalculation
} from '../../../utils/ai-performance';
import { 
  getFeedbackAriaLabel,
  getConfidenceDescription,
  useLiveRegion,
  useKeyboardNavigation,
  useFocusManagement
} from '../../../utils/accessibility';

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

  // Accessibility refs and hooks
  const chipRef = useRef<HTMLDivElement>(null);
  const feedbackButtonRef = useRef<HTMLButtonElement>(null);
  const { announce } = useLiveRegion();
  const { setFocus, restoreFocus } = useFocusManagement();

  // Performance monitoring
  const { startRender, endRender } = useAIPerformanceMonitor('SuggestionChip');

  const handleFeedbackClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setFocus(event.currentTarget);
    announce('Feedback form opened', 'polite');
  }, [setFocus, announce]);

  const handleFeedbackClose = useCallback(() => {
    setAnchorEl(null);
    setFeedbackComment('');
    restoreFocus();
    announce('Feedback form closed', 'polite');
  }, [restoreFocus, announce]);

  // Use debounced feedback to prevent rapid submissions
  const debouncedFeedback = useDebouncedAIFeedback(async (feedback: AIFeedback) => {
    try {
      await onFeedback?.(feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }, 300);

  const handleSubmitFeedback = useCallback(async (type: 'positive' | 'negative') => {
    const feedback: AIFeedback = {
      type,
      comment: feedbackComment.trim() || undefined,
      timestamp: new Date(),
    };
    
    debouncedFeedback(feedback);
    setSubmittedFeedback(type);
    handleFeedbackClose();
    
    // Announce feedback submission
    const message = `Feedback submitted: ${type === 'positive' ? 'helpful' : 'not helpful'}${feedbackComment.trim() ? ' with comment' : ''}`;
    announce(message, 'polite');
  }, [feedbackComment, debouncedFeedback, handleFeedbackClose, announce]);

  // Keyboard navigation for popover
  const { handleKeyDown } = useKeyboardNavigation(
    undefined, // Enter - handled by buttons
    () => handleFeedbackClose() // Escape
  );

  const open = Boolean(anchorEl);

  // Cache expensive calculations
  const chipColor = useCachedAICalculation(
    'chipColor',
    () => {
      if (submittedFeedback === 'positive') return 'success';
      if (submittedFeedback === 'negative') return 'error';
      return 'primary';
    },
    [submittedFeedback]
  );

  const chipLabel = useCachedAICalculation(
    'chipLabel',
    () => {
      let baseLabel = label;
      
      if (confidence !== undefined) {
        baseLabel += ` (${Math.round(confidence)}%)`;
      }
      
      if (submittedFeedback) {
        baseLabel += submittedFeedback === 'positive' ? ' ✓' : ' ✗';
      }
      
      return baseLabel;
    },
    [label, confidence, submittedFeedback]
  );

  // Track render performance
  React.useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  });

  const confidenceDesc = confidence ? getConfidenceDescription(confidence) : undefined;

  return (
    <Box 
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      role="group"
      aria-label="AI suggestion with feedback options"
    >
      <Chip 
        ref={chipRef}
        icon={<WbIncandescent aria-hidden="true" />} 
        label={chipLabel}
        variant={variant}
        color={chipColor}
        size={size}
        aria-label={`AI suggestion: ${label}${confidence ? `, ${confidenceDesc}` : ''}${submittedFeedback ? `, feedback: ${submittedFeedback}` : ''}`}
        {...props} 
      />
      
      {showFeedback && onFeedback && !submittedFeedback && (
        <>
          <IconButton
            size="small"
            onClick={() => handleSubmitFeedback('positive')}
            sx={{ ml: 0.5 }}
            aria-label={getFeedbackAriaLabel('positive')}
            title="Mark as helpful"
            color="success"
          >
            <ThumbUp fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleSubmitFeedback('negative')}
            sx={{ ml: 0.5 }}
            aria-label={getFeedbackAriaLabel('negative')}
            title="Mark as not helpful"
            color="error"
          >
            <ThumbDown fontSize="small" />
          </IconButton>
          <IconButton
            ref={feedbackButtonRef}
            size="small"
            onClick={handleFeedbackClick}
            sx={{ ml: 0.5 }}
            aria-label="Provide detailed feedback"
            aria-expanded={open}
            aria-haspopup="dialog"
            title="Provide detailed feedback"
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
            slotProps={{
              paper: {
                role: 'dialog',
                'aria-labelledby': 'feedback-title',
                'aria-describedby': 'feedback-description',
                onKeyDown: handleKeyDown,
              }
            }}
          >
            <Box sx={{ p: 2, minWidth: 280 }}>
              <Typography 
                id="feedback-title"
                variant="subtitle2" 
                sx={{ mb: 1 }}
              >
                How helpful was this suggestion?
              </Typography>
              <Typography 
                id="feedback-description"
                variant="caption" 
                color="text.secondary"
                sx={{ mb: 2, display: 'block' }}
              >
                Your feedback helps improve AI suggestions
              </Typography>
              
              <Box 
                sx={{ display: 'flex', gap: 1, mb: 2 }}
                role="group"
                aria-label="Quick feedback options"
              >
                <Button
                  variant="outlined"
                  startIcon={<ThumbUp />}
                  onClick={() => handleSubmitFeedback('positive')}
                  color="success"
                  size="small"
                  aria-label="Mark suggestion as helpful"
                >
                  Helpful
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ThumbDown />}
                  onClick={() => handleSubmitFeedback('negative')}
                  color="error"
                  size="small"
                  aria-label="Mark suggestion as not helpful"
                >
                  Not Helpful
                </Button>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1 }}
                component="label"
                htmlFor="additional-feedback"
              >
                Additional feedback (optional):
              </Typography>
              <TextField
                id="additional-feedback"
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Tell us more..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                sx={{ mb: 1 }}
                inputProps={{
                  'aria-label': 'Additional feedback comment',
                  maxLength: 500
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  size="small" 
                  onClick={handleFeedbackClose}
                  aria-label="Cancel feedback"
                >
                  Cancel
                </Button>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => handleSubmitFeedback('positive')}
                  disabled={!feedbackComment.trim()}
                  aria-label="Submit positive feedback with comment"
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
