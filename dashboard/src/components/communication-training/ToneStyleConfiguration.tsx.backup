import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Paper,
  Chip,
  Grid,
  Alert
} from '@mui/material';
import {
  VolumeUp as ToneIcon,
  Style as StyleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  ToneStyleConfig,
  CommunicationTone,
  CommunicationStyle,
  TONE_OPTIONS,
  STYLE_OPTIONS
} from '../../types/communication-training';

interface ToneStyleConfigurationProps {
  config: ToneStyleConfig;
  onConfigChange: (config: ToneStyleConfig) => void;
  isLoading?: boolean;
}

const ToneStyleConfiguration: React.FC<ToneStyleConfigurationProps> = ({
  config,
  onConfigChange,
  isLoading = false
}) => {
  const handleToneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTone = event.target.value as CommunicationTone;
    onConfigChange({
      ...config,
      tone: newTone
    });
  };

  const handleStyleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStyle = event.target.value as CommunicationStyle;
    onConfigChange({
      ...config,
      style: newStyle
    });
  };

  const getCurrentExample = () => {
    return config.examples[config.tone][config.style];
  };

  const getSelectedToneOption = () => {
    return TONE_OPTIONS.find(option => option.value === config.tone);
  };

  const getSelectedStyleOption = () => {
    return STYLE_OPTIONS.find(option => option.value === config.style);
  };

  return (
    <Card>
      <CardHeader
        title="Tone and Style Configuration"
        subheader="Configure how the AI communicates with tenants and contacts"
        avatar={<StyleIcon color="primary" />}
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Tone Selection */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" fullWidth disabled={isLoading}>
              <FormLabel component="legend" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ToneIcon fontSize="small" />
                Communication Tone
              </FormLabel>
              <RadioGroup
                value={config.tone}
                onChange={handleToneChange}
                name="communication-tone"
              >
                {TONE_OPTIONS.map((option) => (
                  <Box key={option.value} sx={{ mb: 2 }}>
                    <FormControlLabel
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {option.label}
                            </Typography>
                            {config.tone === option.value && (
                              <Chip
                                label="Selected"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {option.description}
                          </Typography>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              backgroundColor: config.tone === option.value ? 'primary.50' : 'grey.50',
                              borderColor: config.tone === option.value ? 'primary.main' : 'grey.300'
                            }}
                          >
                            <Typography variant="body2" fontStyle="italic">
                              "{option.example}"
                            </Typography>
                          </Paper>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', mb: 1 }}
                    />
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Style Selection */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" fullWidth disabled={isLoading}>
              <FormLabel component="legend" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StyleIcon fontSize="small" />
                Communication Style
              </FormLabel>
              <RadioGroup
                value={config.style}
                onChange={handleStyleChange}
                name="communication-style"
              >
                {STYLE_OPTIONS.map((option) => (
                  <Box key={option.value} sx={{ mb: 2 }}>
                    <FormControlLabel
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {option.label}
                            </Typography>
                            {config.style === option.value && (
                              <Chip
                                label="Selected"
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {option.description}
                          </Typography>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              backgroundColor: config.style === option.value ? 'secondary.50' : 'grey.50',
                              borderColor: config.style === option.value ? 'secondary.main' : 'grey.300'
                            }}
                          >
                            <Typography variant="body2" fontStyle="italic">
                              "{option.example}"
                            </Typography>
                          </Paper>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', mb: 1 }}
                    />
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Combined Preview */}
          <Grid item xs={12}>
            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Current Configuration Preview
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip
                  label={`${getSelectedToneOption()?.label} Tone`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${getSelectedStyleOption()?.label} Style`}
                  color="secondary"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {getSelectedToneOption()?.description} with {getSelectedStyleOption()?.description.toLowerCase()}
              </Typography>
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                border: '2px solid',
                borderColor: 'primary.main'
              }}
            >
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon fontSize="small" color="primary" />
                Combined Example Response
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontStyle: 'italic',
                  p: 1,
                  backgroundColor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                "{getCurrentExample()}"
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This is how the AI will respond using your selected tone and style combination.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ToneStyleConfiguration;