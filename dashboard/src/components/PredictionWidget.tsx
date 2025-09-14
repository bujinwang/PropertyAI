import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LineChart } from './charts';

interface PredictionData {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  timeframe: string; // e.g., "30 days"
  explanation: string;
  factors: Array<{
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number; // 0-1
  }>;
}

interface PredictionWidgetProps {
  prediction: PredictionData;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
}

const PredictionWidget: React.FC<PredictionWidgetProps> = ({
  prediction,
  onRefresh,
  loading = false,
  error = null,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return null;
    }
  };

  const formatValue = (value: number, metric: string) => {
    if (metric.toLowerCase().includes('rate') || metric.toLowerCase().includes('ratio')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (metric.toLowerCase().includes('cost') || metric.toLowerCase().includes('revenue')) {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {onRefresh && (
          <IconButton onClick={onRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        )}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3">
          {prediction.metric} Prediction
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Prediction Details">
            <IconButton size="small" onClick={() => setShowDetails(!showDetails)}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
          {onRefresh && (
            <Tooltip title="Refresh Prediction">
              <IconButton size="small" onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Main Prediction Display */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ mr: 1 }}>
            {formatValue(prediction.predictedValue, prediction.metric)}
          </Typography>
          {getTrendIcon(prediction.trend)}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Current: {formatValue(prediction.currentValue, prediction.metric)} →
          Predicted ({prediction.timeframe})
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Confidence:</Typography>
          <Chip
            label={`${prediction.confidence}%`}
            color={getConfidenceColor(prediction.confidence)}
            size="small"
          />
        </Box>
      </Box>

      {/* Confidence Bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption">Prediction Confidence</Typography>
          <Typography variant="caption">{prediction.confidence}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={prediction.confidence}
          color={getConfidenceColor(prediction.confidence)}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Detailed View */}
      {showDetails && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Prediction Explanation
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {prediction.explanation}
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Key Factors
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {prediction.factors.map((factor, index) => (
              <Chip
                key={index}
                label={`${factor.name} (${(factor.weight * 100).toFixed(0)}%)`}
                color={getImpactColor(factor.impact)}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default PredictionWidget;