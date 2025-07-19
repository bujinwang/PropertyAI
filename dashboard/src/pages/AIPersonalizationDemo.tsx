/**
 * AI Personalization Dashboard Demo Page
 * Demo page for testing the personalization dashboard component
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import AIPersonalizationDashboard from '../components/personalization/AIPersonalizationDashboard';

const AIPersonalizationDemo: React.FC = () => {
  const handlePreferencesUpdate = (preferences: any) => {
    console.log('Preferences updated:', preferences);
  };

  const handleRefresh = () => {
    console.log('Dashboard refreshed');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AIPersonalizationDashboard
        userId="demo-user-123"
        onPreferencesUpdate={handlePreferencesUpdate}
        onRefresh={handleRefresh}
      />
    </Box>
  );
};

export default AIPersonalizationDemo;