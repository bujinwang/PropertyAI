import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import AutomatedResponseSettings from '../components/communication-training/AutomatedResponseSettings';
import { ResponseSettings } from '../types/communication-training';

const AutomatedResponseSettingsDemo: React.FC = () => {
  const [settings, setSettings] = useState<ResponseSettings>({
    triggers: ['after_hours', 'common_questions'],
    delayMinutes: 30,
    escalationRules: [
      {
        id: 'rule1',
        condition: 'no_response_after_time',
        threshold: 60,
        action: 'escalate_to_human',
        priority: 'medium',
        enabled: true
      },
      {
        id: 'rule2',
        condition: 'negative_sentiment',
        threshold: 70,
        action: 'notify_manager',
        priority: 'high',
        enabled: true
      }
    ],
    maxAttempts: 3,
    businessHoursOnly: false
  });

  const handleSettingsChange = (newSettings: ResponseSettings) => {
    setSettings(newSettings);
    console.log('Settings updated:', newSettings);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Automated Response Settings Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo shows the automated response settings panel for AI Communication Training.
        It includes multi-select triggers, response delay slider, and escalation rules configuration.
      </Typography>
      
      <Box mt={4}>
        <AutomatedResponseSettings
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Current Settings (JSON):
        </Typography>
        <Box
          component="pre"
          sx={{
            backgroundColor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem'
          }}
        >
          {JSON.stringify(settings, null, 2)}
        </Box>
      </Box>
    </Container>
  );
};

export default AutomatedResponseSettingsDemo;