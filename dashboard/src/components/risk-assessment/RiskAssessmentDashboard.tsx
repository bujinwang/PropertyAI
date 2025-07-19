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
} from '../../types/risk-assessment';
import { SummaryMetrics } from './SummaryMetrics';
import { ApplicantList } from './ApplicantList';
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

  // Performance monitoring
  useAIComponentPerformance('RiskAssessmentDashboard');

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
        factors: [],
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
        factors: [],
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
        factors: [],
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
        factors: [],
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
    onApplicantSelect?.(applicant);
  }, [onApplicantSelect]);

  const handleCompareApplicants = useCallback((applicantIds: string[]) => {
    onCompareApplicants?.(applicantIds);
  }, [onCompareApplicants]);

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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Fair Housing Compliance Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Fair Housing Compliance</AlertTitle>
        This risk assessment tool is designed to comply with Fair Housing laws. All assessments 
        are based on objective financial and rental criteria only. Decisions should not be based 
        solely on AI recommendations and must comply with all applicable fair housing regulations.
      </Alert>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
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
      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Important:</strong> All risk assessments must be reviewed by qualified personnel. 
          This AI tool provides guidance only and should not be the sole basis for rental decisions. 
          Ensure compliance with local, state, and federal fair housing laws.
        </Typography>
      </Alert>
    </Container>
  );
});

RiskAssessmentDashboard.displayName = 'RiskAssessmentDashboard';

export default RiskAssessmentDashboard;