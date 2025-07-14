import React from 'react';
import { Box, Paper, Typography, PaperProps } from '@mui/material';
import { WbIncandescent } from '@mui/icons-material';

interface AIGeneratedContentProps extends PaperProps {
  children: React.ReactNode;
}

const AIGeneratedContent: React.FC<AIGeneratedContentProps> = ({ children, ...props }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }} {...props}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <WbIncandescent color="primary" sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          AI Generated Content
        </Typography>
      </Box>
      {children}
    </Paper>
  );
};

export default AIGeneratedContent;
