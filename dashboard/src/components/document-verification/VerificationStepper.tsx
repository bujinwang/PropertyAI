import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  PlayCircle
} from '@mui/icons-material';
import { VerificationStep } from '../../types/document-verification';
import ConfidenceIndicator from '../../design-system/components/ai/ConfidenceIndicator';
import AIGeneratedContent from '../../design-system/components/ai/AIGeneratedContent';

interface VerificationStepperProps {
  steps: VerificationStep[];
  currentStep: number;
  estimatedCompletion: Date;
}

const VerificationStepper: React.FC<VerificationStepperProps> = ({
  steps,
  currentStep,
  estimatedCompletion
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getStepIcon = (step: VerificationStep, stepIndex: number) => {
    if (step.completed) {
      return <CheckCircle color="success" />;
    } else if (step.active) {
      return <PlayCircle color="primary" />;
    } else if (stepIndex < currentStep - 1) {
      return <CheckCircle color="success" />;
    } else {
      return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getTimeRemaining = (targetDate: Date) => {
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Schedule sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            Verification Process
          </Typography>
        </Box>

        {/* Estimated Completion Time with Progress Indicator */}
        <Box sx={{ mb: 3, p: 3, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Schedule sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
              Estimated Completion Time
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                {estimatedCompletion.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {getTimeRemaining(estimatedCompletion)}
              </Typography>
            </Box>
            
            {/* Progress Ring Indicator */}
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: `conic-gradient(
                    ${theme.palette.primary.main} ${(currentStep / steps.length) * 360}deg,
                    ${theme.palette.grey[300]} ${(currentStep / steps.length) * 360}deg
                  )`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {Math.round((currentStep / steps.length) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Stepper
          activeStep={currentStep - 1}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          alternativeLabel={!isMobile}
          sx={{
            '& .MuiStepLabel-root': {
              cursor: 'default'
            },
            '& .MuiStepConnector-line': {
              borderTopWidth: 3,
              borderColor: 'primary.main'
            },
            '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
              borderColor: 'success.main'
            },
            '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
              borderColor: 'primary.main',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.6 },
                '100%': { opacity: 1 }
              }
            },
            '& .MuiStep-root': {
              '&.Mui-active': {
                '& .MuiStepLabel-root': {
                  backgroundColor: 'primary.50',
                  borderRadius: 2,
                  padding: 1,
                  border: '2px solid',
                  borderColor: 'primary.main'
                }
              }
            }
          }}
        >
          {steps.map((step, index) => (
            <Step key={step.id} completed={step.completed} active={step.active}>
              <StepLabel
                StepIconComponent={() => getStepIcon(step, index)}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: step.active ? 'bold' : 'normal',
                    color: step.completed 
                      ? 'success.main' 
                      : step.active 
                        ? 'primary.main' 
                        : 'text.secondary',
                    fontSize: step.active ? '1.1rem' : '1rem'
                  }
                }}
              >
                <Box sx={{ textAlign: isMobile ? 'left' : 'center' }}>
                  <Typography 
                    variant={step.active ? "subtitle1" : "subtitle2"}
                    sx={{ 
                      fontWeight: step.active ? 'bold' : 'medium',
                      color: step.completed 
                        ? 'success.main' 
                        : step.active 
                          ? 'primary.main' 
                          : 'text.primary'
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'block',
                      fontWeight: step.active ? 'medium' : 'normal'
                    }}
                  >
                    {step.description}
                  </Typography>
                  {step.active && (
                    <Typography 
                      variant="caption" 
                      color="primary.main"
                      sx={{ 
                        display: 'block',
                        fontWeight: 'bold',
                        mt: 0.5,
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    >
                      Currently Processing...
                    </Typography>
                  )}
                </Box>
              </StepLabel>
              
              {isMobile && (
                <StepContent>
                  <Box sx={{ pb: 2 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {step.description}
                    </Typography>
                    
                    {step.confidence !== undefined && (
                      <AIGeneratedContent
                        confidence={step.confidence}
                        explanation={`AI confidence for ${step.title.toLowerCase()} stage`}
                        variant="outlined"
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress Confidence:
                          </Typography>
                          <ConfidenceIndicator
                            confidence={step.confidence}
                            size="small"
                            showTooltip={true}
                            explanation={`AI assessment of completion confidence for ${step.title}`}
                          />
                        </Box>
                      </AIGeneratedContent>
                    )}
                  </Box>
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>

        {/* Desktop confidence indicators */}
        {!isMobile && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Step Progress Confidence
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {steps.map((step) => (
                step.confidence !== undefined && (
                  <AIGeneratedContent
                    key={step.id}
                    confidence={step.confidence}
                    explanation={`AI confidence for ${step.title.toLowerCase()} stage`}
                    variant="outlined"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {step.title}:
                      </Typography>
                      <ConfidenceIndicator
                        confidence={step.confidence}
                        size="small"
                        showTooltip={true}
                        explanation={`AI assessment of completion confidence for ${step.title}`}
                      />
                    </Box>
                  </AIGeneratedContent>
                )
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationStepper;