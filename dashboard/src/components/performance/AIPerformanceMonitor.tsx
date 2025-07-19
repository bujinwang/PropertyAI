/**
 * AI Performance Monitor Component
 * Provides real-time performance monitoring for AI components
 */

import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Speed,
  Memory,
  Timeline,
  ExpandMore,
  ExpandLess,
  Warning,
} from '@mui/icons-material';
import { AIPerformanceMetrics } from '../../utils/ai-performance';

interface AIPerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
  threshold?: {
    renderTime: number;
    memoryUsage: number;
  };
}

interface PerformanceStats {
  averageRenderTime: number;
  maxRenderTime: number;
  totalComponents: number;
  slowComponents: string[];
  memoryUsage: number;
}

const AIPerformanceMonitor: React.FC<AIPerformanceMonitorProps> = memo(({
  enabled = process.env.NODE_ENV === 'development',
  showDetails = false,
  threshold = {
    renderTime: 16, // 60fps threshold
    memoryUsage: 50, // MB
  },
}) => {
  const [metrics, setMetrics] = useState<AIPerformanceMetrics[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    averageRenderTime: 0,
    maxRenderTime: 0,
    totalComponents: 0,
    slowComponents: [],
    memoryUsage: 0,
  });
  const [expanded, setExpanded] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Listen for performance metrics from AI components
    const handlePerformanceMetric = (event: CustomEvent<AIPerformanceMetrics>) => {
      const metric = event.detail;
      setMetrics(prev => [...prev.slice(-99), metric]); // Keep last 100 metrics
    };

    // Add event listener for AI performance metrics
    window.addEventListener('ai-performance-metric' as any, handlePerformanceMetric);

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
        
        setStats(prev => ({
          ...prev,
          memoryUsage,
        }));

        // Check memory threshold
        if (memoryUsage > threshold.memoryUsage) {
          setWarnings(prev => [
            ...prev.filter(w => !w.includes('Memory')),
            `Memory usage high: ${memoryUsage.toFixed(1)}MB`,
          ]);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('ai-performance-metric' as any, handlePerformanceMetric);
      clearInterval(memoryInterval);
    };
  }, [enabled, threshold]);

  useEffect(() => {
    if (metrics.length === 0) return;

    // Calculate performance statistics
    const renderTimes = metrics.map(m => m.renderTime);
    const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    
    const slowComponents = metrics
      .filter(m => m.renderTime > threshold.renderTime)
      .map(m => m.componentName)
      .filter((name, index, arr) => arr.indexOf(name) === index); // Unique names

    setStats(prev => ({
      ...prev,
      averageRenderTime,
      maxRenderTime,
      totalComponents: metrics.length,
      slowComponents,
    }));

    // Check render time threshold
    const newWarnings: string[] = [];
    if (averageRenderTime > threshold.renderTime) {
      newWarnings.push(`Average render time high: ${averageRenderTime.toFixed(1)}ms`);
    }
    if (slowComponents.length > 0) {
      newWarnings.push(`Slow components detected: ${slowComponents.join(', ')}`);
    }

    setWarnings(prev => [
      ...prev.filter(w => !w.includes('render') && !w.includes('Slow')),
      ...newWarnings,
    ]);
  }, [metrics, threshold]);

  if (!enabled) return null;

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value > threshold * 1.5) return 'error';
    if (value > threshold) return 'warning';
    return 'success';
  };

  return (
    <Card 
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16, 
        width: expanded ? 400 : 200,
        zIndex: 9999,
        opacity: 0.9,
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Speed color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle2">AI Performance</Typography>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Basic metrics always visible */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Chip
            size="small"
            icon={<Timeline />}
            label={`${stats.averageRenderTime.toFixed(1)}ms`}
            color={getPerformanceColor(stats.averageRenderTime, threshold.renderTime)}
          />
          <Chip
            size="small"
            icon={<Memory />}
            label={`${stats.memoryUsage.toFixed(1)}MB`}
            color={getPerformanceColor(stats.memoryUsage, threshold.memoryUsage)}
          />
        </Box>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1, py: 0 }}>
            <Typography variant="caption">
              {warnings[0]}
              {warnings.length > 1 && ` (+${warnings.length - 1} more)`}
            </Typography>
          </Alert>
        )}

        <Collapse in={expanded}>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Avg Render Time
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((stats.averageRenderTime / (threshold.renderTime * 2)) * 100, 100)}
                color={getPerformanceColor(stats.averageRenderTime, threshold.renderTime)}
                sx={{ mt: 0.5 }}
              />
              <Typography variant="caption">
                {stats.averageRenderTime.toFixed(1)}ms
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Memory Usage
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((stats.memoryUsage / (threshold.memoryUsage * 2)) * 100, 100)}
                color={getPerformanceColor(stats.memoryUsage, threshold.memoryUsage)}
                sx={{ mt: 0.5 }}
              />
              <Typography variant="caption">
                {stats.memoryUsage.toFixed(1)}MB
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Components Monitored: {stats.totalComponents}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Max Render Time: {stats.maxRenderTime.toFixed(1)}ms
              </Typography>
            </Grid>

            {stats.slowComponents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="caption" color="error.main">
                  Slow Components:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {stats.slowComponents.map(component => (
                    <Chip
                      key={component}
                      size="small"
                      label={component}
                      color="error"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {showDetails && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Recent Metrics:
                </Typography>
                <Box sx={{ maxHeight: 100, overflow: 'auto', mt: 0.5 }}>
                  {metrics.slice(-5).map((metric, index) => (
                    <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                      {metric.componentName}: {metric.renderTime.toFixed(1)}ms
                    </Typography>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
});

AIPerformanceMonitor.displayName = 'AIPerformanceMonitor';

export default AIPerformanceMonitor;