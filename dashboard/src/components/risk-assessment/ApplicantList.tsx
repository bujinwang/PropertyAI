import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Compare as CompareIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { ApplicantListProps, Applicant, RiskLevel } from '../../types/risk-assessment';
import RiskLevelIndicator from './RiskLevelIndicator';

type SortField = 'name' | 'date' | 'risk' | 'score';
type SortOrder = 'asc' | 'desc';

/**
 * Applicant list component with sorting, filtering, and selection
 * Displays applicants with color-coded risk indicators
 */
export const ApplicantList: React.FC<ApplicantListProps> = ({
  applicants,
  onSelect,
  onCompare,
  selectedApplicants = [],
  sortBy = 'date',
  sortOrder = 'desc',
  filterByRisk = [],
}) => {
  const [localSortBy, setLocalSortBy] = useState<SortField>(sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>(sortOrder);
  const [localFilterByRisk, setLocalFilterByRisk] = useState<RiskLevel[]>(filterByRisk);
  const [localSelectedApplicants, setLocalSelectedApplicants] = useState<string[]>(selectedApplicants);

  // Sort and filter applicants
  const processedApplicants = useMemo(() => {
    let filtered = applicants;

    // Apply risk level filter
    if (localFilterByRisk.length > 0) {
      filtered = filtered.filter(applicant => 
        applicant.riskAssessment && localFilterByRisk.includes(applicant.riskAssessment.riskLevel)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (localSortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = a.applicationDate.getTime();
          bValue = b.applicationDate.getTime();
          break;
        case 'risk':
          aValue = a.riskAssessment?.riskLevel || 'low';
          bValue = b.riskAssessment?.riskLevel || 'low';
          // Convert to numeric for sorting
          const riskOrder = { low: 1, medium: 2, high: 3 };
          aValue = riskOrder[aValue as RiskLevel];
          bValue = riskOrder[bValue as RiskLevel];
          break;
        case 'score':
          aValue = a.riskAssessment?.overallScore || 0;
          bValue = b.riskAssessment?.overallScore || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return localSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return localSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [applicants, localSortBy, localSortOrder, localFilterByRisk]);

  const handleSort = (field: SortField) => {
    if (localSortBy === field) {
      setLocalSortOrder(localSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setLocalSortBy(field);
      setLocalSortOrder('asc');
    }
  };

  const handleSelectApplicant = (applicantId: string) => {
    const newSelected = localSelectedApplicants.includes(applicantId)
      ? localSelectedApplicants.filter(id => id !== applicantId)
      : [...localSelectedApplicants, applicantId];
    
    setLocalSelectedApplicants(newSelected);
  };

  const handleSelectAll = () => {
    if (localSelectedApplicants.length === processedApplicants.length) {
      setLocalSelectedApplicants([]);
    } else {
      setLocalSelectedApplicants(processedApplicants.map(a => a.id));
    }
  };

  const handleCompare = () => {
    if (onCompare && localSelectedApplicants.length > 1) {
      onCompare(localSelectedApplicants);
    }
  };

  const handleFilterChange = (event: SelectChangeEvent<RiskLevel[]>) => {
    const value = event.target.value;
    setLocalFilterByRisk(typeof value === 'string' ? [] : value);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'default' as const, label: 'Pending' },
      under_review: { color: 'info' as const, label: 'Under Review' },
      approved: { color: 'success' as const, label: 'Approved' },
      rejected: { color: 'error' as const, label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="h3">
            Applicants ({processedApplicants.length})
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center">
            {/* Risk Level Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter by Risk</InputLabel>
              <Select
                multiple
                value={localFilterByRisk}
                onChange={handleFilterChange}
                input={<OutlinedInput label="Filter by Risk" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="low">Low Risk</MenuItem>
                <MenuItem value="medium">Medium Risk</MenuItem>
                <MenuItem value="high">High Risk</MenuItem>
              </Select>
            </FormControl>

            {/* Compare Button */}
            <Button
              variant="outlined"
              startIcon={<CompareIcon />}
              onClick={handleCompare}
              disabled={localSelectedApplicants.length < 2}
            >
              Compare ({localSelectedApplicants.length})
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      localSelectedApplicants.length > 0 && 
                      localSelectedApplicants.length < processedApplicants.length
                    }
                    checked={
                      processedApplicants.length > 0 && 
                      localSelectedApplicants.length === processedApplicants.length
                    }
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'Select all applicants' }}
                  />
                </TableCell>
                
                <TableCell>
                  <TableSortLabel
                    active={localSortBy === 'name'}
                    direction={localSortBy === 'name' ? localSortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                
                <TableCell>
                  <TableSortLabel
                    active={localSortBy === 'date'}
                    direction={localSortBy === 'date' ? localSortOrder : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Application Date
                  </TableSortLabel>
                </TableCell>
                
                <TableCell>Status</TableCell>
                
                <TableCell>
                  <TableSortLabel
                    active={localSortBy === 'risk'}
                    direction={localSortBy === 'risk' ? localSortOrder : 'asc'}
                    onClick={() => handleSort('risk')}
                  >
                    Risk Level
                  </TableSortLabel>
                </TableCell>
                
                <TableCell>
                  <TableSortLabel
                    active={localSortBy === 'score'}
                    direction={localSortBy === 'score' ? localSortOrder : 'asc'}
                    onClick={() => handleSort('score')}
                  >
                    Risk Score
                  </TableSortLabel>
                </TableCell>
                
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {processedApplicants.map((applicant) => (
                <TableRow
                  key={applicant.id}
                  hover
                  selected={localSelectedApplicants.includes(applicant.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={localSelectedApplicants.includes(applicant.id)}
                      onChange={() => handleSelectApplicant(applicant.id)}
                      inputProps={{ 'aria-label': `Select ${applicant.name}` }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {applicant.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {applicant.email}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(applicant.applicationDate)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusChip(applicant.status)}
                  </TableCell>
                  
                  <TableCell>
                    {applicant.riskAssessment ? (
                      <RiskLevelIndicator
                        level={applicant.riskAssessment.riskLevel}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {applicant.riskAssessment ? (
                      <Typography variant="body2" fontWeight="medium">
                        {applicant.riskAssessment.overallScore}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onSelect?.(applicant)}
                        aria-label={`View details for ${applicant.name}`}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              
              {processedApplicants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No applicants found matching the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ApplicantList;