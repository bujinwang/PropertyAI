import React, { useRef, useState } from 'react';
import { 
  Tooltip, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { ExplanationTooltipProps, AIExplanation } from '../../../types/ai';
import { useKeyboardNavigation, useLiveRegion } from '../../../utils/accessibility';

const ExplanationTooltip: React.FC<ExplanationTooltipProps> = ({
  title,
  content,
  children,
  placement = 'top',
  maxWidth = 400,
  interactive = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { announce } = useLiveRegion();

  // Keyboard navigation for tooltip
  const { handleKeyDown } = useKeyboardNavigation(
    undefined, // Enter - handled by default
    () => setIsOpen(false) // Escape
  );

  const handleOpen = () => {
    setIsOpen(true);
    announce(`Explanation opened: ${title}`, 'polite');
  };

  const handleClose = () => {
    setIsOpen(false);
    announce('Explanation closed', 'polite');
  };
  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <Box 
          ref={tooltipRef}
          sx={{ maxWidth }}
          role="tooltip"
          aria-labelledby="tooltip-title"
        >
          <Typography 
            id="tooltip-title"
            variant="subtitle2" 
            sx={{ fontWeight: 600, mb: 1 }}
          >
            {title}
          </Typography>
          <Typography variant="body2">
            {content}
          </Typography>
        </Box>
      );
    }

    const explanation = content as AIExplanation;
    
    return (
      <Box 
        ref={tooltipRef}
        sx={{ maxWidth }}
        role="tooltip"
        aria-labelledby="tooltip-title"
        aria-describedby="tooltip-content"
      >
        <Typography 
          id="tooltip-title"
          variant="subtitle2" 
          sx={{ fontWeight: 600, mb: 1 }}
        >
          {title}
        </Typography>
        
        <Typography 
          id="tooltip-content"
          variant="body2" 
          sx={{ mb: 2 }}
        >
          {explanation?.content || 'No explanation available'}
        </Typography>
        
        {explanation?.factors && explanation.factors.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography 
              variant="caption" 
              sx={{ fontWeight: 600, mb: 1, display: 'block' }}
              component="h4"
            >
              Key Factors:
            </Typography>
            <List 
              dense 
              sx={{ py: 0 }}
              role="list"
              aria-label="AI decision factors"
            >
              {explanation?.factors?.map((factor, index) => (
                <ListItem 
                  key={index} 
                  sx={{ py: 0.5, px: 0 }}
                  role="listitem"
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {factor.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={factor.impact}
                          color={
                            factor.impact === 'positive' ? 'success' :
                            factor.impact === 'negative' ? 'error' : 'default'
                          }
                          aria-label={`Impact: ${factor.impact}`}
                          sx={{ height: 16, fontSize: '0.65rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {factor.description} (Weight: {Math.round(factor.weight * 100)}%)
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
        
        {explanation?.methodology && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
              Methodology:
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {explanation.methodology}
            </Typography>
          </>
        )}
        
        {explanation?.limitations && explanation.limitations.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
              Limitations:
            </Typography>
            <List dense sx={{ py: 0 }}>
              {explanation?.limitations?.map((limitation, index) => (
                <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    • {limitation}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    );
  };

  return (
    <Tooltip
      title={renderContent()}
      placement={placement}
      arrow
      open={isOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 3,
            '& .MuiTooltip-arrow': {
              color: 'background.paper',
              '&::before': {
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        },
      }}
      componentsProps={{
        tooltip: {
          interactive: interactive,
        },
      }}
    >
      {React.isValidElement(children) ? 
        React.cloneElement(children, {
          'aria-describedby': isOpen ? 'tooltip-content' : undefined,
          'aria-expanded': isOpen,
          onKeyDown: handleKeyDown,
        }) : 
        <span 
          tabIndex={0}
          role="button"
          aria-describedby={isOpen ? 'tooltip-content' : undefined}
          aria-expanded={isOpen}
          onKeyDown={handleKeyDown}
        >
          {children}
        </span>
      }
    </Tooltip>
  );
};

export default ExplanationTooltip;