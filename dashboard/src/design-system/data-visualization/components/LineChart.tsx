// PropertyFlow AI Line Chart Component
// Responsive line chart with accessibility and interaction features

import * as React from 'react';
const { useMemo, useRef, useEffect } = React;
import { styled } from '@mui/material/styles';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { tokens } from '../../tokens';
import { VisuallyHidden } from '../../accessibility';
import type { ChartProps, DataPoint, SeriesData } from '../types';

const ChartContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  backgroundColor: 'var(--color-background-paper)',
  borderRadius: tokens.borderRadius.md,
  border: '1px solid var(--color-border-default)',
  padding: tokens.spacing.lg,
  
  '&:focus-within': {
    outline: '2px solid var(--color-primary-main)',
    outlineOffset: '2px',
  },
}));

const ChartHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: tokens.spacing.lg,
  gap: tokens.spacing.xs,
}));

const ChartTitle = styled(Typography)(({ theme }) => ({
  fontSize: tokens.typography.heading.h3.fontSize,
  fontWeight: tokens.typography.fontWeight.semibold,
  color: 'var(--color-text-primary)',
}));

const ChartSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: tokens.typography.body.small.fontSize,
  color: 'var(--color-text-secondary)',
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  flexDirection: 'column',
  gap: tokens.spacing.md,
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  padding: tokens.spacing.md,
}));

export interface LineChartProps extends Omit<ChartProps, 'type'> {
  smooth?: boolean;
  connectNulls?: boolean;
  strokeWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  areaOpacity?: number;
  xAxisType?: 'category' | 'number' | 'date';
  yAxisDomain?: [number | 'auto', number | 'auto'];
  referenceLines?: Array<{
    value: number;
    label?: string;
    color?: string;
    strokeDasharray?: string;
  }>;
}

const formatXAxisTick = (value: any, xAxisType: LineChartProps['xAxisType']) => {
  if (xAxisType === 'date') {
    try {
      const date = typeof value === 'string' ? parseISO(value) : new Date(value);
      return format(date, 'MMM dd');
    } catch {
      return value;
    }
  }
  return value;
};

const formatYAxisTick = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label, xAxisType }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formattedLabel = formatXAxisTick(label, xAxisType);

  return (
    <Box
      sx={{
        backgroundColor: 'var(--color-background-elevated)',
        border: '1px solid var(--color-border-default)',
        borderRadius: tokens.borderRadius.sm,
        padding: tokens.spacing.sm,
        boxShadow: tokens.shadows.md,
        minWidth: '150px',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
        {formattedLabel}
      </Typography>
      {payload.map((entry: any, index: number) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: entry.color,
              borderRadius: '50%',
              mr: 1,
            }}
          />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {entry.name}:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 1 }}>
            {typeof entry.value === 'number' ? formatYAxisTick(entry.value) : entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export const LineChart: React.FC<LineChartProps> = ({
  data,
  loading = false,
  error = null,
  width = '100%',
  height = 400,
  smooth = true,
  connectNulls = false,
  strokeWidth = 2,
  showDots = true,
  showArea = false,
  areaOpacity = 0.1,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  interactive = true,
  animated = true,
  responsive = true,
  xAxisType = 'category',
  yAxisDomain,
  referenceLines = [],
  colorScheme = tokens.colors.chart.default,
  onDataPointClick,
  className,
  'data-testid': dataTestId,
  ...chartProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!data.series.length) return [];

    const categories = data.categories || [];
    const allDataPoints = new Set<string>();

    // Collect all unique x values
    data.series.forEach(series => {
      series.data.forEach(point => {
        allDataPoints.add(String(point.x));
      });
    });

    // Create chart data array
    return Array.from(allDataPoints).sort().map(xValue => {
      const dataPoint: Record<string, any> = { name: xValue };
      
      data.series.forEach(series => {
        const point = series.data.find(p => String(p.x) === xValue);
        dataPoint[series.name] = point ? point.y : null;
      });
      
      return dataPoint;
    });
  }, [data]);

  // Chart accessibility description
  const accessibilityDescription = useMemo(() => {
    const seriesCount = data.series.length;
    const dataPointsCount = chartData.length;
    const seriesNames = data.series.map(s => s.name).join(', ');
    
    return `Line chart with ${seriesCount} data series: ${seriesNames}. ` +
           `Contains ${dataPointsCount} data points. ` +
           `${data.metadata?.title ? `Title: ${data.metadata.title}.` : ''}`;
  }, [data, chartData]);

  // Handle keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !interactive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Add keyboard navigation logic here if needed
      if (event.key === 'Enter' || event.key === ' ') {
        // Could trigger data export or focus on first data point
        event.preventDefault();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [interactive]);

  if (loading) {
    return (
      <ChartContainer className={className} data-testid={dataTestId}>
        <LoadingContainer>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Loading chart data...
          </Typography>
        </LoadingContainer>
      </ChartContainer>
    );
  }

  if (error) {
    return (
      <ChartContainer className={className} data-testid={dataTestId}>
        <ErrorContainer>
          <Alert severity="error" sx={{ width: '100%' }}>
            <Typography variant="body2">
              Failed to load chart data: {error}
            </Typography>
          </Alert>
        </ErrorContainer>
      </ChartContainer>
    );
  }

  if (!chartData.length) {
    return (
      <ChartContainer className={className} data-testid={dataTestId}>
        <ErrorContainer>
          <Alert severity="info" sx={{ width: '100%' }}>
            <Typography variant="body2">
              No data available for this chart
            </Typography>
          </Alert>
        </ErrorContainer>
      </ChartContainer>
    );
  }

  const ChartComponent = responsive ? ResponsiveContainer : RechartsLineChart;
  const chartHeight = responsive ? '100%' : height;
  const chartWidth = responsive ? '100%' : width;

  return (
    <ChartContainer 
      ref={containerRef}
      className={className} 
      data-testid={dataTestId}
      tabIndex={interactive ? 0 : -1}
      role="img"
      aria-label={accessibilityDescription}
      sx={{ height: responsive ? height : 'auto' }}
    >
      {/* Chart Header */}
      {(data.metadata?.title || data.metadata?.subtitle) && (
        <ChartHeader>
          {data.metadata?.title && (
            <ChartTitle>{data.metadata.title}</ChartTitle>
          )}
          {data.metadata?.subtitle && (
            <ChartSubtitle>{data.metadata.subtitle}</ChartSubtitle>
          )}
        </ChartHeader>
      )}

      {/* Accessibility Description */}
      <VisuallyHidden>
        <div aria-live="polite">
          {accessibilityDescription}
        </div>
      </VisuallyHidden>

      {/* Chart */}
      <Box sx={{ width: '100%', height: responsive ? `${height}px` : 'auto' }}>
        {responsive ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
                ...chartProps.margin,
              }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--color-border-default)"
                  opacity={0.3}
                />
              )}
              
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                tickFormatter={(value) => formatXAxisTick(value, xAxisType)}
                stroke="var(--color-border-default)"
              />
              
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                tickFormatter={formatYAxisTick}
                stroke="var(--color-border-default)"
                domain={yAxisDomain}
              />
              
              {showTooltip && (
                <Tooltip content={<CustomTooltip xAxisType={xAxisType} />} />
              )}
              
              {showLegend && (
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                  }}
                />
              )}
              
              {/* Reference Lines */}
              {referenceLines.map((refLine, index) => (
                <ReferenceLine
                  key={index}
                  y={refLine.value}
                  stroke={refLine.color || 'var(--color-warning-main)'}
                  strokeDasharray={refLine.strokeDasharray || '5 5'}
                  label={refLine.label}
                />
              ))}
              
              {/* Data Series */}
              {data.series.map((series, index) => (
                <Line
                  key={series.name}
                  type={smooth ? 'monotone' : 'linear'}
                  dataKey={series.name}
                  stroke={series.color || colorScheme[index % colorScheme.length]}
                  strokeWidth={strokeWidth}
                  dot={showDots ? { r: 4, strokeWidth: 2 } : false}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2,
                    onClick: onDataPointClick ? (data, index) => onDataPointClick(data, index) : undefined
                  }}
                  connectNulls={connectNulls}
                  isAnimationActive={animated}
                  animationDuration={300}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        ) : (
          <RechartsLineChart
            width={typeof chartWidth === 'string' ? 800 : chartWidth}
            height={typeof chartHeight === 'string' ? 400 : chartHeight}
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
              ...chartProps.margin,
            }}
          >
            {/* Same chart content as above */}
          </RechartsLineChart>
        )}
      </Box>

      {/* Chart Footer/Metadata */}
      {data.metadata?.source && (
        <Typography
          variant="caption"
          sx={{
            color: 'var(--color-text-secondary)',
            mt: 2,
            display: 'block',
            textAlign: 'right',
          }}
        >
          Source: {data.metadata.source}
        </Typography>
      )}
    </ChartContainer>
  );
};

export default LineChart;