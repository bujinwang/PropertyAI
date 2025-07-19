import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ApplicantComparison from './ApplicantComparison';
import { ApplicantComparison as ApplicantComparisonType } from '../../types/risk-assessment';

const theme = createTheme();

const mockComparison: ApplicantComparisonType = {
  applicants: [
    {
      id: 'ra1',
      applicantId: '1',
      applicantName: 'John Smith',
      overallScore: 85,
      riskLevel: 'low',
      factors: [
        {
          id: 'f1',
          name: 'Credit Score',
          value: 780,
          weight: 0.3,
          impact: 'positive',
          description: 'Excellent credit score',
          category: 'Financial History',
        },
        {
          id: 'f2',
          name: 'Employment Stability',
          value: '3 years',
          weight: 0.25,
          impact: 'positive',
          description: 'Stable employment',
          category: 'Employment',
        },
      ],
      explanation: 'Strong credit history and stable employment',
      confidence: 92,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      status: 'reviewed',
    },
    {
      id: 'ra2',
      applicantId: '2',
      applicantName: 'Sarah Johnson',
      overallScore: 65,
      riskLevel: 'medium',
      factors: [
        {
          id: 'f3',
          name: 'Credit Score',
          value: 680,
          weight: 0.3,
          impact: 'neutral',
          description: 'Good credit score',
          category: 'Financial History',
        },
        {
          id: 'f4',
          name: 'Employment Stability',
          value: '8 months',
          weight: 0.25,
          impact: 'negative',
          description: 'Recent job change',
          category: 'Employment',
        },
      ],
      explanation: 'Good credit but limited rental history',
      confidence: 78,
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-14'),
      status: 'pending',
    },
  ],
  comparisonFactors: ['Credit Score', 'Employment Stability'],
  recommendations: [
    'Consider the overall risk profile when making decisions',
    'Review individual factors that may require additional verification',
  ],
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ApplicantComparison', () => {
  const mockOnClose = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders multi-column comparison layout', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Check if dialog is rendered
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Check if title shows correct number of applicants
    expect(screen.getByText('Applicant Comparison (2 applicants)')).toBeInTheDocument();
    
    // Check if both applicant names are displayed
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
  });

  it('displays risk factor comparison table with color-coding', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Check if risk factors are displayed
    expect(screen.getByText('Credit Score')).toBeInTheDocument();
    expect(screen.getByText('Employment Stability')).toBeInTheDocument();
    
    // Check if risk scores are displayed
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    
    // Check if risk levels are displayed
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('includes View Detailed Report navigation links', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Check if View Detailed Report buttons are present
    const viewDetailButtons = screen.getAllByText('View Detailed Report');
    expect(viewDetailButtons).toHaveLength(2);
    
    // Test clicking on view details button
    fireEvent.click(viewDetailButtons[0]);
    expect(mockOnViewDetails).toHaveBeenCalledWith('1');
  });

  it('displays fair housing compliance notice', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Fair Housing Compliance')).toBeInTheDocument();
    expect(screen.getByText(/This comparison tool is designed to assist in objective evaluation/)).toBeInTheDocument();
  });

  it('shows AI recommendations when available', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Consider the overall risk profile when making decisions')).toBeInTheDocument();
    expect(screen.getByText('Review individual factors that may require additional verification')).toBeInTheDocument();
  });

  it('handles close action correctly', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Test close button in header
    const closeButton = screen.getByLabelText('Close comparison');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();

    // Test close button in actions
    const closeComparisonButton = screen.getByText('Close Comparison');
    fireEvent.click(closeComparisonButton);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('supports export functionality', () => {
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    
    Object.defineProperty(URL, 'createObjectURL', {
      value: mockCreateObjectURL,
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
      writable: true,
    });
    
    // Mock createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    const exportButton = screen.getByText('Export Comparison');
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('displays confidence indicators for each applicant', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Check if AI Confidence row is present
    expect(screen.getByText('AI Confidence')).toBeInTheDocument();
    
    // The confidence indicators should be rendered (specific values depend on ConfidenceIndicator implementation)
    // We can check that the confidence values are displayed somewhere
    expect(screen.getByText(/92|78/)).toBeInTheDocument();
  });

  it('organizes factors by category', () => {
    renderWithTheme(
      <ApplicantComparison
        comparison={mockComparison}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Check if category headers are displayed
    expect(screen.getByText('Financial History Risk Factors')).toBeInTheDocument();
    expect(screen.getByText('Employment Risk Factors')).toBeInTheDocument();
  });

  it('handles missing risk factors gracefully', () => {
    const comparisonWithMissingFactors: ApplicantComparisonType = {
      ...mockComparison,
      applicants: [
        mockComparison.applicants[0],
        {
          ...mockComparison.applicants[1],
          factors: [mockComparison.applicants[1].factors[0]], // Only one factor
        },
      ],
    };

    renderWithTheme(
      <ApplicantComparison
        comparison={comparisonWithMissingFactors}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Should display N/A for missing factors
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});