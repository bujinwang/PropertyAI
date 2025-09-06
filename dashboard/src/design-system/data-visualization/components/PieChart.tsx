// PropertyFlow AI Pie Chart Component
// Responsive pie/doughnut chart with accessibility and interaction features

import * as React from 'react';
const { useMemo, useRef, useState } = React;
import { styled } from '@mui/material/styles';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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

const ChartContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: tokens.spacing.xl,
  alignItems: 'flex-start',
  
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'center',
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  flexDirection: 'column',
  gap: tokens.spacing.md,
}));

const LegendContainer = styled(Box)(({ theme }) => ({
  minWidth: '200px',
  
  [theme.breakpoints.down('md')]: {
    minWidth: 'auto',
    width: '100%',
  },
}));

const ColorIndicator = styled(Box)(({ theme }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  marginRight: tokens.spacing.sm,
  flexShrink: 0,
}));

export interface PieChartProps extends Omit<ChartProps, 'type'> {
  variant?: 'pie' | 'doughnut';
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  showLabels?: boolean;
  showValues?: boolean;
  showPercentages?: boolean;
  labelPosition?: 'inside' | 'outside';
  customLegend?: boolean;
  sortByValue?: boolean;
  minSliceAngle?: number; // Minimum angle in degrees for a slice to be visible
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

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const total = payload[0].payload.total || payload[0].value;
  const percentage = ((payload[0].value / total) * 100).toFixed(1);

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
        {data.name}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <ColorIndicator sx={{ backgroundColor: payload[0].color }} />
        <Typography variant="body2" sx={{ flex: 1 }}>
          Value:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 1 }}>
          {formatValue(payload[0].value)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 16, mr: 1 }} />
        <Typography variant="body2" sx={{ flex: 1 }}>
          Percentage:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 1 }}>
          {percentage}%
        </Typography>
      </Box>
    </Box>
  );
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, showValues, showPercentages, total }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const percentage = ((value / total) * 100).toFixed(1);

  let label = name;
  if (showValues && showPercentages) {
    label = `${name}\n${formatValue(value)} (${percentage}%)`;
  } else if (showValues) {
    label = `${name}\n${formatValue(value)}`;
  } else if (showPercentages) {
    label = `${name}\n${percentage}%`;
  }

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-text-primary)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="medium"
    >
      {label.split('\n').map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : '1.2em'}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

const CustomLegend = ({ data, onItemClick }: { data: any[], onItemClick?: (item: any) => void }) => {
  return (
    <LegendContainer>
      <Typography variant="h6" sx={{ mb: 2, fontSize: tokens.typography.body.medium.fontSize }}>
        Legend
      </Typography>
      <List dense sx={{ py: 0 }}>
        {data.map((item, index) => {
          const percentage = ((item.value / item.total) * 100).toFixed(1);
          return (
            <ListItem
              key={item.name}
              sx={{
                px: 0,
                py: 0.5,
                cursor: onItemClick ? 'pointer' : 'default',
                '&:hover': onItemClick ? {
                  backgroundColor: 'var(--color-surface-hover)',
                  borderRadius: tokens.borderRadius.sm,
                } : {},
              }}
              onClick={() => onItemClick?.(item)}
            >
              <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                <ColorIndicator sx={{ backgroundColor: item.color }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{item.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 2 }}>
                      {percentage}%
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatValue(item.value)}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </LegendContainer>
  );
};

export const PieChart: React.FC<PieChartProps> = ({
  data,
  loading = false,
  error = null,
  width = '100%',
  height = 400,
  variant = 'pie',
  innerRadius = 0,
  outerRadius = 80,
  startAngle = 0,
  endAngle = 360,
  showLabels = true,
  showValues = false,
  showPercentages = true,
  labelPosition = 'outside',
  customLegend = true,
  sortByValue = true,
  minSliceAngle = 1,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!data.series.length) return [];

    // Use first series for pie chart (pie charts typically show one data series)
    const series = data.series[0];
    if (!series) return [];

    let transformedData = series.data.map((point, index) => ({
      name: String(point.x || point.label || `Item ${index + 1}`),
      value: point.y,
      color: point.color || colorScheme[index % colorScheme.length],
      metadata: point.metadata,
    }));

    // Calculate total for percentages
    const total = transformedData.reduce((sum, item) => sum + item.value, 0);
    transformedData = transformedData.map(item => ({ ...item, total }));

    // Sort by value if requested
    if (sortByValue) {
      transformedData.sort((a, b) => b.value - a.value);
    }

    // Filter out slices that are too small to see
    if (minSliceAngle > 0) {
      const minValue = (minSliceAngle / 360) * total;
      transformedData = transformedData.filter(item => 
        (item.value / total) * 360 >= minSliceAngle
      );
    }

    return transformedData;
  }, [data, colorScheme, sortByValue, minSliceAngle]);

  // Chart accessibility description
  const accessibilityDescription = useMemo(() => {
    const itemCount = chartData.length;
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const itemNames = chartData.map(item => item.name).join(', ');
    
    return `${variant === 'doughnut' ? 'Doughnut' : 'Pie'} chart with ${itemCount} segments: ${itemNames}. ` +
           `Total value: ${formatValue(total)}. ` +
           `${data.metadata?.title ? `Title: ${data.metadata.title}.` : ''}`;
  }, [chartData, variant, data]);

  // Handle pie slice interaction
  const handleSliceClick = (data: any, index: number) => {
    if (onDataPointClick) {
      const dataPoint: DataPoint = {
        x: data.name,
        y: data.value,
        label: data.name,
        color: data.color,
        metadata: data.metadata,
      };
      onDataPointClick(dataPoint, index);
    }
  };

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

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

  const actualInnerRadius = variant === 'doughnut' ? (innerRadius || 40) : 0;
  const total = chartData[0]?.total || 0;

  return (
    <ChartContainer 
      ref={containerRef}
      className={className} 
      data-testid={dataTestId}
      tabIndex={interactive ? 0 : -1}
      role="img"
      aria-label={accessibilityDescription}
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

      {/* Chart Content */}
      <ChartContent>
        {/* Chart */}
        <Box sx={{ 
          flex: 1, 
          height: responsive ? `${height}px` : 'auto',
          minWidth: isMobile ? '100%' : '300px'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={actualInnerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={animated}
                animationDuration={300}
                onClick={handleSliceClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? 'var(--color-primary-main)' : 'none'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
                
                {/* Labels */}
                {showLabels && labelPosition === 'outside' && (
                  <LabelList
                    dataKey="name"
                    position="outside"
                    content={(props) => (
                      <CustomLabel 
                        {...props} 
                        showValues={showValues}
                        showPercentages={showPercentages}
                        total={total}
                      />
                    )}
                  />
                )}
                
                {showLabels && labelPosition === 'inside' && (
                  <LabelList
                    dataKey="name"
                    position="inside"
                    fill="white"
                    fontSize="12"
                    fontWeight="medium"
                  />
                )}
              </Pie>
              
              {showTooltip && (
                <Tooltip content={<CustomTooltip />} />
              )}
              
              {showLegend && !customLegend && (
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                  }}
                />
              )}
            </RechartsPieChart>
          </ResponsiveContainer>
        </Box>

        {/* Custom Legend */}
        {showLegend && customLegend && (
          <CustomLegend 
            data={chartData} 
            onItemClick={onDataPointClick ? (item) => {
              const dataPoint: DataPoint = {
                x: item.name,
                y: item.value,
                label: item.name,
                color: item.color,
                metadata: item.metadata,
              };
              const index = chartData.findIndex(d => d.name === item.name);
              onDataPointClick(dataPoint, index);
            } : undefined}
          />
        )}
      </ChartContent>

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

export default PieChart;