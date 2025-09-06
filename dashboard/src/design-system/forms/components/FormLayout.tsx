// PropertyFlow AI Form Layout Components
// Flexible layouts for organizing form fields with responsive design

import * as React from 'react';
const { forwardRef, ReactNode } = React;
import { styled } from '@mui/material/styles';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { tokens } from '../../tokens';
import { Landmark } from '../../accessibility';

export interface FormSectionProps {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
  children: ReactNode;
  variant?: 'default' | 'card' | 'outlined';
  spacing?: number;
  className?: string;
}

export interface FormRowProps {
  children: ReactNode;
  spacing?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  wrap?: boolean;
  className?: string;
}

export interface FormColumnProps {
  children: ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  className?: string;
}

export interface FormGridProps {
  columns?: number;
  spacing?: number;
  children: ReactNode;
  responsive?: boolean;
  className?: string;
}

export interface FormWizardProps {
  steps: WizardStep[];
  activeStep: number;
  onStepChange: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  showStepContent?: boolean;
  allowStepNavigation?: boolean;
  className?: string;
}

export interface WizardStep {
  label: string;
  description?: string;
  optional?: boolean;
  completed?: boolean;
  error?: boolean;
  content?: ReactNode;
}

// Styled components
const StyledFormSection = styled(Box)<{ variant: FormSectionProps['variant'] }>(({ theme, variant }) => ({
  marginBottom: tokens.spacing.xl,
  
  ...(variant === 'card' && {
    backgroundColor: 'var(--color-background-paper)',
    border: '1px solid var(--color-border-default)',
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.lg,
    boxShadow: tokens.shadows.sm,
  }),
  
  ...(variant === 'outlined' && {
    border: '1px solid var(--color-border-default)',
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.lg,
  }),
  
  ...(variant === 'default' && {
    padding: `0 0 ${tokens.spacing.lg} 0`,
  }),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: tokens.spacing.md,
  cursor: 'pointer',
  
  '&:hover .section-expand-icon': {
    color: 'var(--color-primary-main)',
  },
}));

const SectionTitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: tokens.typography.heading.h3.fontSize,
  fontWeight: tokens.typography.fontWeight.semibold,
  color: 'var(--color-text-primary)',
  marginBottom: tokens.spacing.xs / 2,
}));

const SectionDescription = styled(Typography)(({ theme }) => ({
  fontSize: tokens.typography.body.medium.fontSize,
  color: 'var(--color-text-secondary)',
  lineHeight: 1.4,
}));

const RequiredIndicator = styled('span')(({ theme }) => ({
  color: 'var(--color-error-main)',
  marginLeft: tokens.spacing.xs,
  fontSize: '0.9em',
}));

const StyledFormRow = styled(Box)<{ spacing?: number; alignItems?: string; wrap?: boolean }>(({ theme, spacing = 2, alignItems = 'stretch', wrap = true }) => ({
  display: 'flex',
  gap: tokens.spacing[spacing] || tokens.spacing.md,
  alignItems,
  flexWrap: wrap ? 'wrap' : 'nowrap',
  marginBottom: tokens.spacing.md,
  
  '& > *': {
    minWidth: 0, // Prevent flex items from overflowing
  },
  
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    
    '& > *': {
      width: '100%',
    },
  },
}));

const StyledFormGrid = styled(Grid)<{ columns?: number; responsive?: boolean }>(({ theme, columns = 2, responsive = true }) => ({
  display: 'grid',
  gridTemplateColumns: responsive 
    ? `repeat(auto-fit, minmax(280px, 1fr))` 
    : `repeat(${columns}, 1fr)`,
  gap: tokens.spacing.lg,
  
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: responsive ? 'repeat(auto-fit, minmax(240px, 1fr))' : `repeat(${Math.min(columns, 2)}, 1fr)`,
  },
  
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStep-root': {
    '& .MuiStepLabel-root': {
      cursor: 'pointer',
      
      '&:hover': {
        '& .MuiStepLabel-label': {
          color: 'var(--color-primary-main)',
        },
      },
    },
    
    '& .MuiStepLabel-label': {
      fontSize: tokens.typography.body.medium.fontSize,
      fontWeight: tokens.typography.fontWeight.medium,
      
      '&.Mui-active': {
        color: 'var(--color-primary-main)',
        fontWeight: tokens.typography.fontWeight.semibold,
      },
      
      '&.Mui-error': {
        color: 'var(--color-error-main)',
      },
    },
    
    '& .MuiStepIcon-root': {
      '&.Mui-active': {
        color: 'var(--color-primary-main)',
      },
      
      '&.Mui-error': {
        color: 'var(--color-error-main)',
      },
    },
  },
}));

// FormSection component
export const FormSection = forwardRef<HTMLDivElement, FormSectionProps>((props, ref) => {
  const {
    title,
    description,
    collapsible = false,
    defaultExpanded = true,
    required = false,
    children,
    variant = 'default',
    spacing = 2,
    className,
    ...boxProps
  } = props;

  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleToggle = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  return (
    <StyledFormSection 
      ref={ref}
      variant={variant}
      className={className}
      {...boxProps}
    >
      {(title || description) && (
        <SectionHeader onClick={handleToggle}>
          <SectionTitleContainer>
            {title && (
              <SectionTitle>
                {title}
                {required && <RequiredIndicator>*</RequiredIndicator>}
              </SectionTitle>
            )}
            {description && (
              <SectionDescription>
                {description}
              </SectionDescription>
            )}
          </SectionTitleContainer>
          
          {collapsible && (
            <Box className="section-expand-icon">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          )}
        </SectionHeader>
      )}
      
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ '& > * + *': { mt: spacing } }}>
          {children}
        </Box>
      </Collapse>
      
      {title && variant !== 'default' && <Divider sx={{ mt: 2 }} />}
    </StyledFormSection>
  );
});

FormSection.displayName = 'FormSection';

// FormRow component
export const FormRow = forwardRef<HTMLDivElement, FormRowProps>((props, ref) => {
  const {
    children,
    spacing = 2,
    alignItems = 'stretch',
    wrap = true,
    className,
    ...boxProps
  } = props;

  return (
    <StyledFormRow
      ref={ref}
      spacing={spacing}
      alignItems={alignItems}
      wrap={wrap}
      className={className}
      {...boxProps}
    >
      {children}
    </StyledFormRow>
  );
});

FormRow.displayName = 'FormRow';

// FormColumn component
export const FormColumn = forwardRef<HTMLDivElement, FormColumnProps>((props, ref) => {
  const {
    children,
    xs = 12,
    sm,
    md,
    lg,
    xl,
    spacing = 2,
    className,
    ...gridProps
  } = props;

  return (
    <Grid 
      item 
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      ref={ref}
      className={className}
      {...gridProps}
    >
      <Box sx={{ '& > * + *': { mt: spacing } }}>
        {children}
      </Box>
    </Grid>
  );
});

FormColumn.displayName = 'FormColumn';

// FormGrid component
export const FormGrid = forwardRef<HTMLDivElement, FormGridProps>((props, ref) => {
  const {
    columns = 2,
    spacing = 2,
    children,
    responsive = true,
    className,
    ...boxProps
  } = props;

  return (
    <StyledFormGrid
      ref={ref}
      columns={columns}
      responsive={responsive}
      className={className}
      {...boxProps}
    >
      {children}
    </StyledFormGrid>
  );
});

FormGrid.displayName = 'FormGrid';

// FormWizard component
export const FormWizard = forwardRef<HTMLDivElement, FormWizardProps>((props, ref) => {
  const {
    steps,
    activeStep,
    onStepChange,
    orientation = 'horizontal',
    showStepContent = true,
    allowStepNavigation = true,
    className,
    ...boxProps
  } = props;

  const handleStepClick = (stepIndex: number) => {
    if (allowStepNavigation && stepIndex !== activeStep) {
      onStepChange(stepIndex);
    }
  };

  return (
    <Landmark role="form" aria-label="Multi-step form">
      <Box ref={ref} className={className} {...boxProps}>
        <StyledStepper 
          activeStep={activeStep} 
          orientation={orientation}
          sx={{ mb: 3 }}
        >
          {steps.map((step, index) => (
            <Step 
              key={step.label}
              completed={step.completed}
              disabled={!allowStepNavigation}
            >
              <StepLabel
                optional={step.optional && (
                  <Typography variant="caption" color="text.secondary">
                    Optional
                  </Typography>
                )}
                error={step.error}
                onClick={() => handleStepClick(index)}
                sx={{ 
                  cursor: allowStepNavigation ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': {
                    userSelect: 'none',
                  },
                }}
              >
                {step.label}
              </StepLabel>
              
              {orientation === 'vertical' && showStepContent && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  {step.content}
                </StepContent>
              )}
            </Step>
          ))}
        </StyledStepper>
        
        {orientation === 'horizontal' && showStepContent && (
          <Box sx={{ mt: 3 }}>
            {steps[activeStep]?.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {steps[activeStep].description}
              </Typography>
            )}
            {steps[activeStep]?.content}
          </Box>
        )}
      </Box>
    </Landmark>
  );
});

FormWizard.displayName = 'FormWizard';

// Utility components
export const FormDivider = styled(Divider)(({ theme }) => ({
  margin: `${tokens.spacing.xl} 0`,
  
  '&.MuiDivider-root': {
    borderColor: 'var(--color-border-default)',
  },
  
  '& .MuiDivider-wrapper': {
    padding: `0 ${tokens.spacing.md}`,
    
    '& .MuiTypography-root': {
      color: 'var(--color-text-secondary)',
      fontSize: tokens.typography.body.small.fontSize,
      fontWeight: tokens.typography.fontWeight.medium,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
}));

export const FormCard = styled(Paper)(({ theme }) => ({
  padding: tokens.spacing.xl,
  backgroundColor: 'var(--color-background-paper)',
  border: '1px solid var(--color-border-default)',
  borderRadius: tokens.borderRadius.lg,
  boxShadow: tokens.shadows.md,
  
  '&:hover': {
    boxShadow: tokens.shadows.lg,
  },
}));

export const FormActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: tokens.spacing.md,
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginTop: tokens.spacing.xl,
  paddingTop: tokens.spacing.lg,
  borderTop: '1px solid var(--color-border-default)',
  
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
    
    '& .MuiButton-root': {
      width: '100%',
    },
  },
}));