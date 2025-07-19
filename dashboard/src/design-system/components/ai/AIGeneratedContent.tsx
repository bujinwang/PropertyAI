import React, { useState, useMemo, useCallback, memo } from 'react';
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

const AIGeneratedContent: React.FC<AIGeneratedContentProps> = memo(({ 
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

  // Memoize expensive calculations
  const confidenceColor = useMemo(() => {
    if (confidence === undefined) return 'primary.main';
    if (confidence >= 80) return 'success.main';
    if (confidence >= 60) return 'warning.main';
    return 'error.main';
  }, [confidence]);

  const paperSx = useMemo(() => ({
    p: 2,
    position: 'relative',
    ...(variant === 'outlined' && {
      border: '2px solid',
      borderColor: 'primary.main',
      backgroundColor: alpha('#1976d2', 0.02),
    }),
    ...(variant === 'filled' && {
      backgroundColor: alpha('#1976d2', 0.08),
      borderLeft: '4px solid',
      borderColor: 'primary.main',
    }),
  }), [variant]);

  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    const feedback: AIFeedback = {
      type,
      comment: feedbackComment.trim() || undefined,
      timestamp: new Date(),
    };
    
    onFeedback?.(feedback);
    setSubmittedFeedback(type);
    setShowFeedback(false);
    setFeedbackComment('');
  }, [feedbackComment, onFeedback]);

  const handleToggleFeedback = useCallback(() => {
    setShowFeedback(prev => !prev);
  }, []);

  return (
    <Paper 
      elevation={variant === 'outlined' ? 0 : 2} 
      sx={paperSx} 
      className={className}
      {...props}
    >
      {showLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WbIncandescent color="primary" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              AI Generated Content
            </Typography>
            {confidence !== undefined && (
              <Chip
                size="small"
                label={`${Math.round(confidence)}% confidence`}
                sx={{ 
                  ml: 1, 
                  height: 20,
                  fontSize: '0.75rem',
                  backgroundColor: confidenceColor,
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
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <Info fontSize="small" />
                </IconButton>
              </ExplanationTooltip>
            )}
          </Box>
          
          {onFeedback && !submittedFeedback && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => handleFeedback('positive')}
                sx={{ color: 'success.main' }}
                aria-label="Positive feedback"
              >
                <ThumbUp fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleFeedback('negative')}
                sx={{ color: 'error.main' }}
                aria-label="Negative feedback"
              >
                <ThumbDown fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleToggleFeedback}
                aria-label="Provide detailed feedback"
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
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Provide additional feedback (optional):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            placeholder="Tell us more about your experience..."
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={() => setShowFeedback(false)}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => handleFeedback('positive')}
              startIcon={<ThumbUp />}
              sx={{ mr: 1 }}
            >
              Helpful
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => handleFeedback('negative')}
              startIcon={<ThumbDown />}
            >
              Not Helpful
            </Button>
          </Box>
        </Box>
      </Collapse>
      
      {children}
    </Paper>
  );
});

AIGeneratedContent.displayName = 'AIGeneratedContent';

export default AIGeneratedContent;
