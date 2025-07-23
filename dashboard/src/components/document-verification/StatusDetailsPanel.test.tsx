import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StatusDetailsPanel from './StatusDetailsPanel';
import { VerificationState } from '../../types/document-verification';

const theme = createTheme();

const mockVerificationState: VerificationState = {
  currentStep: 2,
  totalSteps: 4,
  status: 'in_review',
  estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  confidence: 78,
  lastUpdated: new Date(),
  requiredActions: [],
  documents: [
    {
      id: '1',
      type: 'income_proof',
      name: 'Pay Stub - December 2024',
      status: 'verified',
      uploadedAt: new Date(),
      confidence: 92
    }
  ]
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('StatusDetailsPanel', () => {
  it('renders verification status details', () => {
    renderWithTheme(<StatusDetailsPanel verificationState={mockVerificationState} />);
    
    expect(screen.getByText('Verification Status Details')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('Verification Confidence')).toBeInTheDocument();
    expect(screen.getByText('Document Summary')).toBeInTheDocument();
  });

  it('displays correct progress percentage', () => {
    renderWithTheme(<StatusDetailsPanel verificationState={mockVerificationState} />);
    
    expect(screen.getByText('Step 2 of 4 completed')).toBeInTheDocument();
  });

  it('shows confidence score', () => {
    renderWithTheme(<StatusDetailsPanel verificationState={mockVerificationState} />);
    
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('displays document information', () => {
    renderWithTheme(<StatusDetailsPanel verificationState={mockVerificationState} />);
    
    expect(screen.getByText('Pay Stub - December 2024')).toBeInTheDocument();
    expect(screen.getByText('1 of 1 documents verified')).toBeInTheDocument();
  });
});