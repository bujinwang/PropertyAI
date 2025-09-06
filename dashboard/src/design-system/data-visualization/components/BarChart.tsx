// PropertyFlow AI Bar Chart Component
// Responsive bar chart with grouping, stacking, and accessibility features

import * as React from 'react';
const { useMemo, useRef } = React;
import { styled } from '@mui/material/styles';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { tokens } from '../../tokens';
import { VisuallyHidden } from '../../accessibility';
import type { ChartProps, DataPoint } from '../types';

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

export interface BarChartProps extends Omit<ChartProps, 'type'> {
  orientation?: 'vertical' | 'horizontal';
  barSize?: number;
  barGap?: number;
  barCategoryGap?: number;
  radius?: number | [number, number, number, number];
  showValues?: boolean;
  valuePosition?: 'top' | 'inside' | 'insideTop' | 'insideBottom';
  groupBy?: string;
}

const formatValue = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

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
        {label}
      </Typography>
      {payload.map((entry: any, index: number) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: entry.color,
              borderRadius: tokens.borderRadius.xs,
              mr: 1,
            }}
          />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {entry.name}:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 1 }}>
            {typeof entry.value === 'number' ? formatValue(entry.value) : entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const CustomLabel = ({ x, y, width, height, value, position }: any) => {
  const labelY = position === 'top' ? y - 5 : 
                 position === 'inside' ? y + height / 2 :
                 position === 'insideTop' ? y + 15 :
                 y + height - 15;
  
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      dominantBaseline={position === 'top' ? 'auto' : 'central'}
      fill="var(--color-text-primary)"
      fontSize="12"
      fontWeight="medium"
    >
      {formatValue(value)}
    </text>
  );
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  loading = false,
  error = null,
  width = '100%',
  height = 400,
  orientation = 'vertical',
  stacked = false,
  barSize,
  barGap = 4,
  barCategoryGap = '20%',
  radius = 0,
  showValues = false,
  valuePosition = 'top',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  interactive = true,
  animated = true,
  responsive = true,
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
        dataPoint[series.name] = point ? point.y : 0;
      });
      
      return dataPoint;
    });
  }, [data]);

  // Chart accessibility description
  const accessibilityDescription = useMemo(() => {
    const seriesCount = data.series.length;
    const dataPointsCount = chartData.length;
    const seriesNames = data.series.map(s => s.name).join(', ');
    const chartType = stacked ? 'stacked bar' : 'grouped bar';
    
    return `${orientation} ${chartType} chart with ${seriesCount} data series: ${seriesNames}. ` +
           `Contains ${dataPointsCount} categories. ` +
           `${data.metadata?.title ? `Title: ${data.metadata.title}.` : ''}`;
  }, [data, chartData, stacked, orientation]);

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
        <LoadingContainer>
          <Alert severity="error" sx={{ width: '100%' }}>
            <Typography variant="body2">
              Failed to load chart data: {error}
            </Typography>
          </Alert>
        </LoadingContainer>
      </ChartContainer>
    );
  }

  if (!chartData.length) {
    return (
      <ChartContainer className={className} data-testid={dataTestId}>
        <LoadingContainer>
          <Alert severity="info" sx={{ width: '100%' }}>
            <Typography variant="body2">
              No data available for this chart
            </Typography>
          </Alert>
        </LoadingContainer>
      </ChartContainer>
    );
  }

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
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            layout={orientation === 'horizontal' ? 'verseReverse' : 'horizontal'}
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
              ...chartProps.margin,
            }}
            barGap={barGap}
            barCategoryGap={barCategoryGap}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--color-border-default)"
                opacity={0.3}
              />
            )}
            
            {orientation === 'vertical' ? (
              <>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  stroke="var(--color-border-default)"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  tickFormatter={formatValue}
                  stroke="var(--color-border-default)"
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  tickFormatter={formatValue}
                  stroke="var(--color-border-default)"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  stroke="var(--color-border-default)"
                />
              </>
            )}
            
            {showTooltip && (
              <Tooltip content={<CustomTooltip />} />
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
            
            {/* Data Series */}
            {data.series.map((series, seriesIndex) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={series.color || colorScheme[seriesIndex % colorScheme.length]}
                radius={radius}
                maxBarSize={barSize}
                stackId={stacked ? 'stack' : undefined}
                isAnimationActive={animated}
                animationDuration={300}
                onClick={onDataPointClick ? (data, index) => onDataPointClick(data, seriesIndex) : undefined}
                style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
              >
                {/* Individual bar colors if specified in data */}
                {series.data.map((point, pointIndex) => (
                  point.color && (
                    <Cell 
                      key={`cell-${pointIndex}`} 
                      fill={point.color} 
                    />
                  )
                ))}
                
                {/* Value labels */}
                {showValues && (
                  <CustomLabel position={valuePosition} />
                )}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
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

export default BarChart;