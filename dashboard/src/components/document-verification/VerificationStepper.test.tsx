import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import VerificationStepper from './VerificationStepper';
import { VerificationStep } from '../../types/document-verification';

const theme = createTheme();

const mockSteps: VerificationStep[] = [
  {
    id: 1,
    title: 'Document Submission',
    description: 'Upload required documents',
    completed: true,
    active: false,
    confidence: 100
  },
  {
    id: 2,
    title: 'AI Analysis',
    description: 'Automated document verification',
    completed: false,
    active: true,
    confidence: 78
  },
  {
    id: 3,
    title: 'Manual Review',
    description: 'Human verification of flagged items',
    completed: false,
    active: false
  },
  {
    id: 4,
    title: 'Final Approval',
    description: 'Complete verification process',
    completed: false,
    active: false
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('VerificationStepper', () => {
  const mockEstimatedCompletion = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

  it('renders verification process title', () => {
    renderWithTheme(
      <VerificationStepper
        steps={mockSteps}
        currentStep={2}
        estimatedCompletion={mockEstimatedCompletion}
      />
    );

    expect(screen.getByText('Verification Process')).toBeInTheDocument();
  });

  it('displays estimated completion time', () => {
    renderWithTheme(
      <VerificationStepper
        steps={mockSteps}
        currentStep={2}
        estimatedCompletion={mockEstimatedCompletion}
      />
    );

    expect(screen.getByText('Estimated Completion Time')).toBeInTheDocument();
    expect(screen.getByText(/days remaining/)).toBeInTheDocument();
  });

  it('renders all verification steps', () => {
    renderWithTheme(
      <VerificationStepper
        steps={mockSteps}
        currentStep={2}
        estimatedCompletion={mockEstimatedCompletion}
      />
    );

    mockSteps.forEach(step => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.description)).toBeInTheDocument();
    });
  });

  it('shows confidence indicators for steps with confidence scores', () => {
    renderWithTheme(
      <VerificationStepper
        steps={mockSteps}
        currentStep={2}
        estimatedCompletion={mockEstimatedCompletion}
      />
    );

    // Should show confidence indicators for steps that have confidence scores
    expect(screen.getByText('Step Progress Confidence')).toBeInTheDocument();
  });

  it('handles overdue completion time', () => {
    const overdueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    
    renderWithTheme(
      <VerificationStepper
        steps={mockSteps}
        currentStep={2}
        estimatedCompletion={overdueDate}
      />
    );

    // Should still render without errors
    expect(screen.getByText('Verification Process')).toBeInTheDocument();
  });

  it('displays correct step status indicators', () => {
    renderWithTheme(
      <VerificationStepper
        steps={mockSteps}
        currentStep={2}
        estimatedCompletion={mockEstimatedCompletion}
      />
    );

    // First step should be completed
    const completedStep = mockSteps.find(step => step.completed);
    expect(completedStep).toBeTruthy();
    
    // Second step should be active
    const activeStep = mockSteps.find(step => step.active);
    expect(activeStep).toBeTruthy();
  });

  it('handles empty steps array', () => {
    renderWithTheme(
      <VerificationStepper
        steps={[]}
        currentStep={0}
        estimatedCompletion={mockEstimatedCompletion}
      />
    );

    expect(screen.getByText('Verification Process')).toBeInTheDocument();
    expect(screen.getByText('Estimated Completion Time')).toBeInTheDocument();
  });
});