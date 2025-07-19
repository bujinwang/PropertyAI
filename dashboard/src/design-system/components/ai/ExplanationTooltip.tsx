import React from 'react';
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

const ExplanationTooltip: React.FC<ExplanationTooltipProps> = ({
  title,
  content,
  children,
  placement = 'top',
  maxWidth = 400,
  interactive = true,
}) => {
  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <Box sx={{ maxWidth }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
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
      <Box sx={{ maxWidth }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          {explanation.content}
        </Typography>
        
        {explanation.factors && explanation.factors.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Key Factors:
            </Typography>
            <List dense sx={{ py: 0 }}>
              {explanation.factors.map((factor, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
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
        
        {explanation.methodology && (
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
        
        {explanation.limitations && explanation.limitations.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
              Limitations:
            </Typography>
            <List dense sx={{ py: 0 }}>
              {explanation.limitations.map((limitation, index) => (
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
      interactive={interactive}
      arrow
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
    >
      {React.isValidElement(children) ? children : <span>{children}</span>}
    </Tooltip>
  );
};

export default ExplanationTooltip;