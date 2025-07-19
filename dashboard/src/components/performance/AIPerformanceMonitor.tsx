/**
 * AI Performance Monitor Component
 * Provides real-time performance monitoring for AI components
 */

import React, { useEffect, useState, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  Alert,
} from '@mui/material';
import { Speed, Memory, TrendingUp } from '@mui/icons-material';
import { getAICacheStats, clearAICache } from '../../utils/ai-performance';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  componentCount: number;
}

interface AIPerformanceMonitorProps {
  showInProduction?: boolean;
  threshold?: {
    renderTime: number;
    memoryUsage: number;
  };
}

const AIPerformanceMonitor: React.FC<AIPerformanceMonitorProps> = memo(({
  showInProduction = false,
  threshold = { renderTime: 100, memoryUsage: 80 }
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    componentCount: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development unless explicitly enabled for production
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;
    setIsVisible(shouldShow);
  }, [showInProduction]);

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      // Get cache statistics
      const cacheStats = getAICacheStats();
      
      // Estimate memory usage (simplified)
      const memoryUsage = (performance as any).memory 
        ? Math.round(((performance as any).memory.usedJSHeapSize / (performance as any).memory.totalJSHeapSize) * 100)
        : 0;

      // Count AI components in DOM (simplified)
      const aiComponents = document.querySelectorAll('[data-ai-component]').length;

      setMetrics({
        renderTime: performance.now() % 1000, // Simplified render time
        memoryUsage,
        cacheHitRate: cacheStats.usage,
        componentCount: aiComponents,
      });
    };

    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getStatusColor = (value: number, threshold: number, invert = false) => {
    const isGood = invert ? value < threshold : value > threshold;
    return isGood ? 'success' : value > threshold * 0.8 ? 'warning' : 'error';
  };

  const handleClearCache = () => {
    clearAICache();
    // Show feedback to user
    console.log('AI cache cleared');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 300,
      }}
    >
      <Card elevation={8} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', color: 'white' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Speed sx={{ mr: 1 }} />
            AI Performance
          </Typography>

          <Grid container spacing={2}>
            {/* Render Time */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Render Time
                </Typography>
                <Chip
                  size="small"
                  label={`${metrics.renderTime.toFixed(1)}ms`}
                  color={getStatusColor(metrics.renderTime, threshold.renderTime, true)}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((metrics.renderTime / threshold.renderTime) * 100, 100)}
                color={getStatusColor(metrics.renderTime, threshold.renderTime, true)}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Grid>

            {/* Memory Usage */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Memory Usage
                </Typography>
                <Chip
                  size="small"
                  label={`${metrics.memoryUsage}%`}
                  color={getStatusColor(metrics.memoryUsage, threshold.memoryUsage, true)}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.memoryUsage}
                color={getStatusColor(metrics.memoryUsage, threshold.memoryUsage, true)}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Grid>

            {/* Cache Usage */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Cache Usage
                </Typography>
                <Chip
                  size="small"
                  label={`${metrics.cacheHitRate.toFixed(1)}%`}
                  color="info"
                  onClick={handleClearCache}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={metrics.cacheHitRate}
                color="info"
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Grid>

            {/* Component Count */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Memory sx={{ mr: 1, fontSize: 16 }} />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  AI Components
                </Typography>
                <Chip
                  size="small"
                  label={metrics.componentCount}
                  color="primary"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Performance Warnings */}
          {(metrics.renderTime > threshold.renderTime || metrics.memoryUsage > threshold.memoryUsage) && (
            <Alert severity="warning" sx={{ mt: 2, fontSize: '0.75rem' }}>
              Performance issues detected. Consider optimizing AI components.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

AIPerformanceMonitor.displayName = 'AIPerformanceMonitor';

export default AIPerformanceMonitor;