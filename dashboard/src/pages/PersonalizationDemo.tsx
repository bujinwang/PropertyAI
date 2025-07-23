/**
 * Personalization Demo Page
 * Demonstrates the AI Personalization Dashboard with recommendation cards
 */

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
} from '@mui/material';
import {
  PersonalVideo,
  Lightbulb,
  TrendingUp,
} from '@mui/icons-material';
import AIPersonalizationDashboard from '../components/personalization/AIPersonalizationDashboard';

const PersonalizationDemo: React.FC = () => {
  const handlePreferencesUpdate = (preferences: any) => {
    console.log('Preferences updated:', preferences);
  };

  const handleRefresh = () => {
    console.log('Dashboard refreshed');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          AI Personalization Dashboard Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Experience personalized recommendations powered by AI
        </Typography>
        
        {/* Feature Highlights */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Chip
            icon={<PersonalVideo />}
            label="Personalized Content"
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<Lightbulb />}
            label="AI Explanations"
            color="secondary"
            variant="outlined"
          />
          <Chip
            icon={<TrendingUp />}
            label="Smart Recommendations"
            color="success"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Features Overview */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Key Features Demonstrated
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <Box>
            <Typography variant="h6" color="primary.main" gutterBottom>
              📋 Recommendation Cards
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cards with images, descriptions, and call-to-action buttons for each recommendation
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="primary.main" gutterBottom>
              🎯 "For You" Labels
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clear personalization indicators showing content tailored specifically for the user
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="primary.main" gutterBottom>
              💡 AI Explanations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              "Why am I seeing this?" links that provide detailed explanations for each recommendation
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Demo Instructions */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Try These Interactions:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <li>Click the <strong>"Book Now"</strong> or <strong>"Learn More"</strong> buttons to see CTA interactions</li>
          <li>Click the <strong>info icon (ℹ️)</strong> to see "Why am I seeing this?" explanations</li>
          <li>Use the <strong>thumbs up/down</strong> buttons to provide feedback on recommendations</li>
          <li>Notice the <strong>"For You"</strong> labels indicating personalized content</li>
          <li>Observe the <strong>confidence indicators</strong> showing AI certainty levels</li>
        </Box>
      </Paper>

      {/* Main Dashboard */}
      <AIPersonalizationDashboard
        userId="demo-user-123"
        onPreferencesUpdate={handlePreferencesUpdate}
        onRefresh={handleRefresh}
      />
    </Container>
  );
};

export default PersonalizationDemo;