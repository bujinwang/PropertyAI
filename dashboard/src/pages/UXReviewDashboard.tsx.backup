import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  BugReport as BugReportIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  PriorityHigh as PriorityHighIcon,
  Comment as CommentIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import { UXReviewCard } from '../components/ux-review/UXReviewCard';
import { UXReviewStats } from '../components/ux-review/UXReviewStats';
import { UXReviewFilters } from '../components/ux-review/UXReviewFilters';
import { UXReviewCreateModal } from '../components/ux-review/UXReviewCreateModal';
import { UXReviewDetailModal } from '../components/ux-review/UXReviewDetailModal';
import { UXReviewAssignmentModal } from '../components/ux-review/UXReviewAssignmentModal';

interface UXReview {
  id: string;
  title: string;
  description?: string;
  componentId: string;
  componentType: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewType: string;
  severity: string;
  status: string;
  priority: string;
  url?: string;
  screenshots: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  metrics: any[];
  assignments: any[];
  comments: any[];
}

interface UXReviewStatsData {
  totalReviews: number;
  openReviews: number;
  inProgressReviews: number;
  resolvedReviews: number;
  severityStats: Array<{ severity: string; _count: { _all: number } }>;
  priorityStats: Array<{ priority: string; _count: { _all: number } }>;
  typeStats: Array<{ reviewType: string; _count: { _all: number } }>;
}

const UXReviewDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedReview, setSelectedReview] = useState<UXReview | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    priority: '',
    reviewType: '',
    tags: '',
  });

  // Fetch UX Review stats
  const { data: stats, isLoading: statsLoading } = useQuery<UXReviewStatsData>({
    queryKey: ['ux-review-stats'],
    queryFn: () => apiService.get('/ux-review/stats'),
  });

  // Fetch UX Reviews
  const { data: reviews, isLoading: reviewsLoading, refetch } = useQuery<UXReview[]>({
    queryKey: ['ux-reviews', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiService.get(`/ux-review?${params.toString()}`);
    },
  });

  // Fetch my assignments
  const { data: myAssignments } = useQuery<UXReview[]>({
    queryKey: ['ux-review-assignments'],
    queryFn: () => apiService.get(`/ux-review/assignments/${localStorage.getItem('userId')}`),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleCreateReview = async (reviewData: any) => {
    try {
      await apiService.post('/ux-review', reviewData);
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  const handleAssignReview = async (assignmentData: any) => {
    try {
      await apiService.post(`/ux-review/${selectedReview?.id}/assign`, assignmentData);
      setIsAssignmentModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error assigning review:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <BugReportIcon color="error" />;
      case 'IN_PROGRESS':
        return <AccessTimeIcon color="warning" />;
      case 'RESOLVED':
        return <CheckCircleIcon color="success" />;
      default:
        return <BugReportIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredReviews = reviews?.filter((review) => {
    if (tabValue === 1) {
      return myAssignments?.some((assignment) => assignment.review.id === review.id);
    }
    return true;
  }) || [];

  if (statsLoading || reviewsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6">Loading UX Review Dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box p={isMobile ? 2 : 4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          UX Review Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateModalOpen(true)}
          size={isMobile ? 'small' : 'medium'}
        >
          New Review
        </Button>
      </Box>

      {/* Stats Overview */}
      {stats && <UXReviewStats stats={stats} />}

      {/* Filters */}
      <UXReviewFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        isMobile={isMobile}
      />

      {/* Tabs */}
      <Box mb={3}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Reviews" icon={<BugReportIcon />} />
          <Tab label="My Assignments" icon={<AssignmentIcon />} />
        </Tabs>
      </Box>

      {/* Reviews Grid */}
      <Grid container spacing={3}>
        {filteredReviews.map((review) => (
          <Grid item xs={12} md={6} lg={4} key={review.id}>
            <UXReviewCard
              review={review}
              onClick={() => setSelectedReview(review)}
              onAssign={() => {
                setSelectedReview(review);
                setIsAssignmentModalOpen(true);
              }}
              getStatusIcon={getStatusIcon}
              getSeverityColor={getSeverityColor}
              getPriorityColor={getPriorityColor}
            />
          </Grid>
        ))}
      </Grid>

      {filteredReviews.length === 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" py={8}>
          <BugReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No reviews found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 1 ? 'You have no assigned reviews' : 'No reviews match your filters'}
          </Typography>
        </Box>
      )}

      {/* Modals */}
      <UXReviewCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateReview}
      />

      <UXReviewDetailModal
        open={selectedReview !== null}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
      />

      <UXReviewAssignmentModal
        open={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        review={selectedReview}
        onAssign={handleAssignReview}
      />
    </Box>
  );
};

export default UXReviewDashboard;