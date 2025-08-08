import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  TextField, 
  Button,
  Collapse,
  Chip,
  alpha
} from '@mui/material';
import { 
  WbIncandescent, 
  ThumbUp, 
  ThumbDown, 
  ExpandMore, 
  ExpandLess,
  Info
} from '@mui/icons-material';
import { AIGeneratedContentProps, AIFeedback } from '../../../types/ai';
import ExplanationTooltip from './ExplanationTooltip';
import { 
  useConfidenceColor, 
  useDebouncedAIFeedback, 
  useAIPerformanceMonitor,
  useOptimizedAIProps
} from '../../../utils/ai-performance';
import { 
  getAIContentAriaAttributes, 
  getConfidenceDescription, 
  getFeedbackAriaLabel,
  useLiveRegion,
  useKeyboardNavigation,
  announceToScreenReader
} from '../../../utils/accessibility';

export const AIGeneratedContent: React.FC<AIGeneratedContentProps> = ({
  children,
  confidence,
  explanation,
  onFeedback,
  variant = 'outlined',
  showLabel = true,
  className,
  ...props 
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<'positive' | 'negative' | null>(null);

  // Accessibility refs and hooks
  const containerRef = useRef<HTMLDivElement>(null);
  const feedbackButtonRef = useRef<HTMLButtonElement>(null);
  const { announce } = useLiveRegion();

  // Performance monitoring
  const { startRender, endRender } = useAIPerformanceMonitor('AIGeneratedContent');
  
  // Optimize props to prevent unnecessary re-renders, excluding showLabel from DOM props
  const { showLabel: _, ...domProps } = props;
  const optimizedProps = useOptimizedAIProps({ variant, className, ...domProps });

  // Memoize expensive calculations using performance utilities
  const confidenceColor = useConfidenceColor(confidence || 0, true);
  
  // Convert to MUI color format
  const muiConfidenceColor = useMemo(() => {
    if (confidence === undefined) return 'primary.main';
    if (confidenceColor === 'success') return 'success.main';
    if (confidenceColor === 'warning') return 'warning.main';
    return 'error.main';
  }, [confidence, confidenceColor]);

  const paperSx = useMemo(() => ({
    p: 2,
    position: 'relative',
    ...(optimizedProps.variant === 'outlined' && {
      border: '2px solid',
      borderColor: 'primary.main',
      backgroundColor: alpha('#1976d2', 0.02),
    }),
    ...(optimizedProps.variant === 'filled' && {
      backgroundColor: alpha('#1976d2', 0.08),
      borderLeft: '4px solid',
      borderColor: 'primary.main',
    }),
  }), [optimizedProps.variant]);

  // Use debounced feedback to prevent rapid submissions
  const debouncedFeedback = useDebouncedAIFeedback((feedback: AIFeedback) => {
    onFeedback?.(feedback);
  }, 300);

  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    const feedback: AIFeedback = {
      type,
      comment: feedbackComment.trim() || undefined,
      timestamp: new Date(),
    };
    
    debouncedFeedback(feedback);
    setSubmittedFeedback(type);
    setShowFeedback(false);
    setFeedbackComment('');
    
    // Announce feedback submission to screen readers
    const message = `Feedback submitted: ${type === 'positive' ? 'helpful' : 'not helpful'}${feedbackComment.trim() ? ' with comment' : ''}`;
    announce(message, 'polite');
  }, [feedbackComment, debouncedFeedback, announce]);

  const handleToggleFeedback = useCallback(() => {
    setShowFeedback(prev => {
      const newValue = !prev;
      if (newValue) {
        announce('Feedback form opened', 'polite');
        // Focus the feedback form when opened
        setTimeout(() => {
          const textField = containerRef.current?.querySelector('textarea');
          textField?.focus();
        }, 100);
      } else {
        announce('Feedback form closed', 'polite');
      }
      return newValue;
    });
  }, [announce]);

  // Keyboard navigation for feedback
  const { handleKeyDown } = useKeyboardNavigation(
    () => handleToggleFeedback(), // Enter/Space
    () => setShowFeedback(false)  // Escape
  );

  // Track render performance
  React.useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  });

  // Get accessibility attributes
  const ariaAttributes = getAIContentAriaAttributes(confidence, true);
  const confidenceDesc = confidence ? getConfidenceDescription(confidence) : undefined;

  // Announce content changes
  useEffect(() => {
    if (submittedFeedback) {
      announceToScreenReader(`AI content feedback: ${submittedFeedback}`, 'polite');
    }
  }, [submittedFeedback]);

  return (
    <Paper 
      ref={containerRef}
      elevation={optimizedProps.variant === 'outlined' ? 0 : 2} 
      sx={paperSx} 
      className={optimizedProps.className}
      role="region"
      aria-label="AI generated content"
      {...ariaAttributes}
      {...optimizedProps}
    >
      {showLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WbIncandescent 
              color="primary" 
              sx={{ mr: 1 }} 
              aria-hidden="true"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              fontWeight={500}
              id="ai-content-label"
            >
              AI Generated Content
            </Typography>
            {confidence !== undefined && (
              <Chip
                size="small"
                label={`${Math.round(confidence)}% confidence`}
                aria-label={`AI confidence level: ${confidenceDesc}`}
                sx={{ 
                  ml: 1, 
                  height: 20,
                  fontSize: '0.75rem',
                  backgroundColor: muiConfidenceColor,
                  color: 'white',
                }}
              />
            )}
            {explanation && (
              <ExplanationTooltip
                title="AI Explanation"
                content={explanation}
                placement="top"
              >
                <IconButton 
                  size="small" 
                  sx={{ ml: 0.5 }}
                  aria-label="View AI explanation"
                >
                  <Info fontSize="small" />
                </IconButton>
              </ExplanationTooltip>
            )}
          </Box>
          
          {onFeedback && !submittedFeedback && (
            <Box 
              sx={{ display: 'flex', alignItems: 'center' }}
              role="group"
              aria-label="AI content feedback options"
            >
              <IconButton
                size="small"
                onClick={() => handleFeedback('positive')}
                sx={{ color: 'success.main' }}
                aria-label={getFeedbackAriaLabel('positive')}
                title="Mark as helpful"
              >
                <ThumbUp fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleFeedback('negative')}
                sx={{ color: 'error.main' }}
                aria-label={getFeedbackAriaLabel('negative')}
                title="Mark as not helpful"
              >
                <ThumbDown fontSize="small" />
              </IconButton>
              <IconButton
                ref={feedbackButtonRef}
                size="small"
                onClick={handleToggleFeedback}
                onKeyDown={handleKeyDown}
                aria-label="Provide detailed feedback"
                aria-expanded={showFeedback}
                aria-controls="feedback-form"
                title="Provide detailed feedback"
              >
                {showFeedback ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}
          
          {submittedFeedback && (
            <Chip
              size="small"
              label={`Feedback: ${submittedFeedback}`}
              color={submittedFeedback === 'positive' ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Box>
      )}
      
      <Collapse in={showFeedback}>
        <Box 
          id="feedback-form"
          sx={{ mb: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}
          role="form"
          aria-label="AI content feedback form"
        >
          <Typography 
            variant="body2" 
            sx={{ mb: 1 }}
            component="label"
            htmlFor="feedback-comment"
          >
            Provide additional feedback (optional):
          </Typography>
          <TextField
            id="feedback-comment"
            fullWidth
            multiline
            rows={2}
            size="small"
            placeholder="Tell us more about your experience..."
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            sx={{ mb: 1 }}
            aria-describedby="feedback-help"
            inputProps={{
              'aria-label': 'Additional feedback comment',
              maxLength: 500
            }}
          />
          <Typography 
            id="feedback-help"
            variant="caption" 
            color="text.secondary"
            sx={{ display: 'block', mb: 1 }}
          >
            Help us improve AI suggestions by sharing your experience
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={() => setShowFeedback(false)}
              aria-label="Cancel feedback"
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => handleFeedback('positive')}
              startIcon={<ThumbUp />}
              sx={{ mr: 1 }}
              aria-label="Submit positive feedback"
            >
              Helpful
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => handleFeedback('negative')}
              startIcon={<ThumbDown />}
              aria-label="Submit negative feedback"
            >
              Not Helpful
            </Button>
          </Box>
        </Box>
      </Collapse>
      
      <Box 
        aria-labelledby="ai-content-label"
        aria-describedby={confidence ? 'confidence-description' : undefined}
      >
        {children}
      </Box>
      
      {/* Hidden description for screen readers */}
      {confidence && (
        <span 
          id="confidence-description" 
          className="sr-only"
          style={{ 
            position: 'absolute', 
            left: '-10000px', 
            width: '1px', 
            height: '1px', 
            overflow: 'hidden' 
          }}
        >
          {confidenceDesc}
        </span>
      )}
    </Paper>
  );
};

AIGeneratedContent.displayName = 'AIGeneratedContent';

export default AIGeneratedContent;
