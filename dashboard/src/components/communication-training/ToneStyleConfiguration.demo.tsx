import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import ToneStyleConfiguration from './ToneStyleConfiguration';
import { ToneStyleConfig, DEFAULT_TONE_STYLE_EXAMPLES } from '../../types/communication-training';

const ToneStyleConfigurationDemo: React.FC = () => {
  const [config, setConfig] = useState<ToneStyleConfig>({
    tone: 'friendly',
    style: 'detailed',
    examples: DEFAULT_TONE_STYLE_EXAMPLES
  });

  const handleConfigChange = (newConfig: ToneStyleConfig) => {
    setConfig(newConfig);
    console.log('Configuration changed:', newConfig);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tone & Style Configuration Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This demo shows the tone and style configuration component for AI communication training.
      </Typography>
      
      <ToneStyleConfiguration
        config={config}
        onConfigChange={handleConfigChange}
      />

      <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Current Configuration (Debug)
        </Typography>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </Box>
    </Container>
  );
};

export default ToneStyleConfigurationDemo;