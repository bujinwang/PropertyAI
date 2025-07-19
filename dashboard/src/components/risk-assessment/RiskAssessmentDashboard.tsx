import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Divider,
} from '@mui/material';
import {
  RiskAssessmentDashboardProps,
  RiskAssessmentMetrics,
  Applicant,
  RiskAssessment,
  ApplicantComparison as ApplicantComparisonType,
} from '../../types/risk-assessment';
import { SummaryMetrics } from './SummaryMetrics';
import { ApplicantList } from './ApplicantList';
import { RiskFactorBreakdown } from './RiskFactorBreakdown';
import { ApplicantComparison } from './ApplicantComparison';
import { AccessibilityEnhancements, SkipNavigation, KeyboardInstructions } from './AccessibilityEnhancements';
import { useAIComponentPerformance } from '../../utils/ai-performance';

/**
 * Main Risk Assessment Dashboard component
 * Provides comprehensive view of applicant risk assessments with compliance features
 */
export const RiskAssessmentDashboard: React.FC<RiskAssessmentDashboardProps> = memo(({
  propertyId,
  dateRange,
  onApplicantSelect,
  onCompareApplicants,
}) => {
  const [metrics, setMetrics] = useState<RiskAssessmentMetrics | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showRiskBreakdown, setShowRiskBreakdown] = useState(false);
  const [comparisonData, setComparisonData] = useState<ApplicantComparisonType | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showKeyboardInstructions, setShowKeyboardInstructions] = useState(false);

  // Performance monitoring
  useAIComponentPerformance('RiskAssessmentDashboard');

  // Detect keyboard navigation to show instructions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setShowKeyboardInstructions(true);
      }
      if (event.key === '?' && event.shiftKey) {
        setShowKeyboardInstructions(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mock data for demonstration - in real implementation, this would come from API
  const mockMetrics: RiskAssessmentMetrics = {
    totalApplicants: 24,
    riskCategories: {
      low: 12,
      medium: 8,
      high: 4,
    },
    averageScore: 67.5,
    pendingReviews: 6,
    lastUpdated: new Date(),
  };

  const mockApplicants: Applicant[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      applicationDate: new Date('2024-01-15'),
      status: 'under_review',
      riskAssessment: {
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
            description: 'Excellent credit score indicating strong financial responsibility',
            category: 'Financial History',
          },
          {
            id: 'f2',
            name: 'Employment Stability',
            value: '3 years',
            weight: 0.25,
            impact: 'positive',
            description: 'Stable employment with current employer for 3+ years',
            category: 'Employment',
          },
          {
            id: 'f3',
            name: 'Income to Rent Ratio',
            value: '3.2x',
            weight: 0.2,
            impact: 'positive',
            description: 'Income is 3.2 times the monthly rent, well above minimum requirements',
            category: 'Financial Capacity',
          },
          {
            id: 'f4',
            name: 'Rental History',
            value: 'Excellent',
            weight: 0.15,
            impact: 'positive',
            description: 'No late payments or issues in previous rental history',
            category: 'Rental History',
          },
          {
            id: 'f5',
            name: 'References',
            value: 'Strong',
            weight: 0.1,
            impact: 'positive',
            description: 'Positive references from previous landlords and employers',
            category: 'References',
          },
        ],
        explanation: 'Strong credit history and stable employment',
        confidence: 92,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        status: 'reviewed',
      },
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 234-5678',
      applicationDate: new Date('2024-01-14'),
      status: 'pending',
      riskAssessment: {
        id: 'ra2',
        applicantId: '2',
        applicantName: 'Sarah Johnson',
        overallScore: 65,
        riskLevel: 'medium',
        factors: [
          {
            id: 'f6',
            name: 'Credit Score',
            value: 680,
            weight: 0.3,
            impact: 'neutral',
            description: 'Good credit score but some minor issues in credit history',
            category: 'Financial History',
          },
          {
            id: 'f7',
            name: 'Employment Stability',
            value: '8 months',
            weight: 0.25,
            impact: 'negative',
            description: 'Recent job change, less than 1 year with current employer',
            category: 'Employment',
          },
          {
            id: 'f8',
            name: 'Income to Rent Ratio',
            value: '2.8x',
            weight: 0.2,
            impact: 'neutral',
            description: 'Income meets minimum requirements but with limited buffer',
            category: 'Financial Capacity',
          },
          {
            id: 'f9',
            name: 'Rental History',
            value: 'Limited',
            weight: 0.15,
            impact: 'negative',
            description: 'Limited rental history, first-time renter',
            category: 'Rental History',
          },
          {
            id: 'f10',
            name: 'References',
            value: 'Good',
            weight: 0.1,
            impact: 'positive',
            description: 'Good references from employer and personal contacts',
            category: 'References',
          },
        ],
        explanation: 'Good credit but limited rental history',
        confidence: 78,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        status: 'pending',
      },
    },
    {
      id: '3',
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '(555) 345-6789',
      applicationDate: new Date('2024-01-13'),
      status: 'under_review',
      riskAssessment: {
        id: 'ra3',
        applicantId: '3',
        applicantName: 'Michael Brown',
        overallScore: 35,
        riskLevel: 'high',
        factors: [
          {
            id: 'f11',
            name: 'Credit Score',
            value: 580,
            weight: 0.3,
            impact: 'negative',
            description: 'Below average credit score with recent delinquencies',
            category: 'Financial History',
          },
          {
            id: 'f12',
            name: 'Employment Stability',
            value: 'Unemployed',
            weight: 0.25,
            impact: 'negative',
            description: 'Currently unemployed, gap in employment history',
            category: 'Employment',
          },
          {
            id: 'f13',
            name: 'Income to Rent Ratio',
            value: '1.8x',
            weight: 0.2,
            impact: 'negative',
            description: 'Income below recommended minimum requirements',
            category: 'Financial Capacity',
          },
          {
            id: 'f14',
            name: 'Rental History',
            value: 'Issues',
            weight: 0.15,
            impact: 'negative',
            description: 'Previous eviction and late payment history',
            category: 'Rental History',
          },
          {
            id: 'f15',
            name: 'References',
            value: 'Limited',
            weight: 0.1,
            impact: 'negative',
            description: 'Unable to provide adequate references',
            category: 'References',
          },
        ],
        explanation: 'Credit concerns and employment gaps',
        confidence: 88,
        createdAt: new Date('2024-01-13'),
        updatedAt: new Date('2024-01-13'),
        status: 'reviewed',
      },
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      applicationDate: new Date('2024-01-12'),
      status: 'approved',
      riskAssessment: {
        id: 'ra4',
        applicantId: '4',
        applicantName: 'Emily Davis',
        overallScore: 92,
        riskLevel: 'low',
        factors: [
          {
            id: 'f16',
            name: 'Credit Score',
            value: 820,
            weight: 0.3,
            impact: 'positive',
            description: 'Exceptional credit score with perfect payment history',
            category: 'Financial History',
          },
          {
            id: 'f17',
            name: 'Employment Stability',
            value: '5 years',
            weight: 0.25,
            impact: 'positive',
            description: 'Long-term stable employment with excellent track record',
            category: 'Employment',
          },
          {
            id: 'f18',
            name: 'Income to Rent Ratio',
            value: '4.1x',
            weight: 0.2,
            impact: 'positive',
            description: 'High income providing excellent financial buffer',
            category: 'Financial Capacity',
          },
          {
            id: 'f19',
            name: 'Rental History',
            value: 'Excellent',
            weight: 0.15,
            impact: 'positive',
            description: 'Outstanding rental history with glowing landlord references',
            category: 'Rental History',
          },
          {
            id: 'f20',
            name: 'References',
            value: 'Excellent',
            weight: 0.1,
            impact: 'positive',
            description: 'Exceptional references from multiple sources',
            category: 'References',
          },
        ],
        explanation: 'Excellent credit and strong references',
        confidence: 95,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        status: 'approved',
      },
    },
  ];

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true);
      try {
        // In real implementation, make API calls here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        setMetrics(mockMetrics);
        setApplicants(mockApplicants);
        setError(null);
      } catch (err) {
        setError('Failed to load risk assessment data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propertyId, dateRange]);

  const handleRefreshMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      setMetrics({ ...mockMetrics, lastUpdated: new Date() });
    } catch (err) {
      setError('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  }, [mockMetrics]);

  const handleApplicantSelect = useCallback((applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowRiskBreakdown(true);
    onApplicantSelect?.(applicant);
  }, [onApplicantSelect]);

  const handleCompareApplicants = useCallback((applicantIds: string[]) => {
    // Create comparison data from selected applicants
    const selectedApplicants = applicants.filter(a => applicantIds.includes(a.id) && a.riskAssessment);
    
    if (selectedApplicants.length > 1) {
      const comparison: ApplicantComparisonType = {
        applicants: selectedApplicants.map(a => a.riskAssessment!),
        comparisonFactors: ['Credit Score', 'Employment Stability', 'Income to Rent Ratio', 'Rental History', 'References'],
        recommendations: [
          'Consider the overall risk profile when making decisions',
          'Review individual factors that may require additional verification',
          'Ensure all decisions comply with fair housing regulations',
          'Document the rationale for your final decision',
        ],
      };
      
      setComparisonData(comparison);
      setShowComparison(true);
    }
    
    onCompareApplicants?.(applicantIds);
  }, [applicants, onCompareApplicants]);

  const handleCloseRiskBreakdown = useCallback(() => {
    setShowRiskBreakdown(false);
    setSelectedApplicant(null);
  }, []);

  const handleApproveAssessment = useCallback(async (assessmentId: string) => {
    // In real implementation, make API call to approve assessment
    console.log('Approving assessment:', assessmentId);
    // Update local state
    setApplicants(prev => prev.map(applicant => 
      applicant.riskAssessment?.id === assessmentId
        ? { ...applicant, riskAssessment: { ...applicant.riskAssessment, status: 'approved' as const } }
        : applicant
    ));
  }, []);

  const handleRejectAssessment = useCallback(async (assessmentId: string, reason: string) => {
    // In real implementation, make API call to reject assessment
    console.log('Rejecting assessment:', assessmentId, 'Reason:', reason);
    // Update local state
    setApplicants(prev => prev.map(applicant => 
      applicant.riskAssessment?.id === assessmentId
        ? { ...applicant, riskAssessment: { ...applicant.riskAssessment, status: 'rejected' as const } }
        : applicant
    ));
  }, []);

  const handleCloseComparison = useCallback(() => {
    setShowComparison(false);
    setComparisonData(null);
  }, []);

  const handleViewApplicantDetails = useCallback((applicantId: string) => {
    const applicant = applicants.find(a => a.id === applicantId);
    if (applicant) {
      setSelectedApplicant(applicant);
      setShowRiskBreakdown(true);
      setShowComparison(false);
    }
  }, [applicants]);

  // Memoize expensive calculations
  const displayMetrics = useMemo(() => metrics || mockMetrics, [metrics, mockMetrics]);
  
  const sortedApplicants = useMemo(() => {
    return [...applicants].sort((a, b) => {
      const dateA = new Date(a.applicationDate).getTime();
      const dateB = new Date(b.applicationDate).getTime();
      return dateB - dateA; // Sort by date descending
    });
  }, [applicants]);

  return (
    <>
      <SkipNavigation />
      <Container maxWidth="xl" sx={{ py: 3 }} id="main-content">
        {/* Keyboard Navigation Instructions */}
        <KeyboardInstructions visible={showKeyboardInstructions} />

        {/* Fair Housing Compliance Notice */}
        <Alert severity="info" sx={{ mb: 3 }} role="alert">
          <AlertTitle>Fair Housing Compliance</AlertTitle>
          This risk assessment tool is designed to comply with Fair Housing laws. All assessments 
          are based on objective financial and rental criteria only. Decisions should not be based 
          solely on AI recommendations and must comply with all applicable fair housing regulations.
        </Alert>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} role="alert" aria-live="polite">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

      {/* Summary Metrics */}
      <Box mb={4}>
        <SummaryMetrics
          metrics={displayMetrics}
          loading={loading}
          onRefresh={handleRefreshMetrics}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Applicant List */}
      <Box>
        <ApplicantList
          applicants={sortedApplicants}
          onSelect={handleApplicantSelect}
          onCompare={handleCompareApplicants}
          sortBy="date"
          sortOrder="desc"
        />
      </Box>

        {/* Additional Compliance Notice */}
        <Alert severity="warning" sx={{ mt: 3 }} role="alert">
          <Typography variant="body2">
            <strong>Important:</strong> All risk assessments must be reviewed by qualified personnel. 
            This AI tool provides guidance only and should not be the sole basis for rental decisions. 
            Ensure compliance with local, state, and federal fair housing laws.
          </Typography>
        </Alert>

      {/* Risk Factor Breakdown Modal */}
      {selectedApplicant?.riskAssessment && (
        <RiskFactorBreakdown
          assessment={selectedApplicant.riskAssessment}
          open={showRiskBreakdown}
          onClose={handleCloseRiskBreakdown}
          onApprove={handleApproveAssessment}
          onReject={handleRejectAssessment}
        />
      )}

      {/* Applicant Comparison Modal */}
      {comparisonData && (
        <ApplicantComparison
          comparison={comparisonData}
          onClose={handleCloseComparison}
          onViewDetails={handleViewApplicantDetails}
        />
      )}

        {/* Accessibility Enhancements */}
        <AccessibilityEnhancements />
      </Container>
    </>
  );
});

RiskAssessmentDashboard.displayName = 'RiskAssessmentDashboard';

export default RiskAssessmentDashboard;