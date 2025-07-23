import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as AttachMoneyIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Help as HelpIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { InsightCardProps, InsightPriority } from '../../types/ai-insights';
import ExplanationTooltip from '../../design-system/components/ai/ExplanationTooltip';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onClick,
  showCategory = true,
  compact = false
}) => {
  // Priority colors
  const priorityColors = {
    critical: '#f44336',
    high: '#ff9800',
    medium: '#2196f3',
    low: '#4caf50'
  };

  // Category icons
  const categoryIcons = {
    financial: AttachMoneyIcon,
    operational: SettingsIcon,
    tenant_satisfaction: PeopleIcon
  };

  // Get priority color
  const getPriorityColor = (priority: InsightPriority) => {
    return priorityColors[priority] || '#757575';
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: '#f44336', fontSize: 16 }} />;
      default:
        return null;
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
    const IconComponent = categoryIcons[insight.category];
    return IconComponent ? <IconComponent sx={{ fontSize: 16, mr: 0.5 }} /> : null;
  };

  // Format metric value
  const formatMetricValue = (value: number | string, format?: string, unit?: string) => {
    if (typeof value === 'number' && format === 'percentage') {
      return `${value}%`;
    }
    if (typeof value === 'number' && format === 'currency') {
      return `$${value.toLocaleString()}`;
    }
    return `${value}${unit || ''}`;
  };

  // Render chart component with enhanced styling and interactivity
  const renderChart = () => {
    if (!insight.chartData || compact) return null;

    const baseChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          display: insight.chartData.type === 'doughnut',
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context: any) => {
              return `${insight.title} - ${context[0]?.label || ''}`;
            },
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
              const formattedValue = typeof value === 'number' ? 
                (insight.category === 'financial' ? `$${value.toLocaleString()}` : 
                 value.toString().includes('.') ? `${value.toFixed(1)}` : value.toString()) : value;
              return `${label}: ${formattedValue}`;
            }
          }
        }
      },
      scales: insight.chartData.type === 'doughnut' ? {} : {
        x: {
          display: !compact,
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10
            },
            maxTicksLimit: 6
          }
        },
        y: {
          display: !compact,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              size: 10
            },
            maxTicksLimit: 5,
            callback: function(value: any) {
              if (insight.category === 'financial') {
                return `$${value.toLocaleString()}`;
              }
              return value;
            }
          }
        }
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 6
        },
        line: {
          tension: 0.3
        }
      },
      ...insight.chartData.options
    };

    const enhancedChartData = {
      ...insight.chartData,
      datasets: insight.chartData.datasets.map((dataset, index) => ({
        ...dataset,
        // Enhanced styling based on chart type and category
        ...(insight.chartData.type === 'line' && {
          borderWidth: 2,
          pointBackgroundColor: dataset.borderColor || '#2196f3',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: dataset.fill !== undefined ? dataset.fill : true,
          backgroundColor: dataset.backgroundColor || 
            (dataset.borderColor ? `${dataset.borderColor}20` : 'rgba(33, 150, 243, 0.1)')
        }),
        ...(insight.chartData.type === 'bar' && {
          borderRadius: 4,
          borderSkipped: false,
          backgroundColor: dataset.backgroundColor || 
            (insight.priority === 'critical' ? '#f44336' :
             insight.priority === 'high' ? '#ff9800' :
             insight.priority === 'medium' ? '#2196f3' : '#4caf50')
        }),
        ...(insight.chartData.type === 'doughnut' && {
          borderWidth: 2,
          borderColor: '#fff',
          hoverBorderWidth: 3
        })
      }))
    };

    const chartProps = {
      data: enhancedChartData,
      options: baseChartOptions,
      height: compact ? 80 : 140
    };

    switch (insight.chartData.type) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      default:
        return <Line {...chartProps} />;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        },
        border: insight.priority === 'critical' ? `2px solid ${priorityColors.critical}` : 'none'
      }}
      onClick={() => onClick(insight)}
    >
      <CardContent sx={{ pb: compact ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography 
                variant={compact ? "subtitle1" : "h6"} 
                component="h3" 
                sx={{ lineHeight: 1.3 }}
              >
                {insight.title}
              </Typography>
              <ExplanationTooltip
                title="AI Insight Explanation"
                content={insight.explanation}
              >
                <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </ExplanationTooltip>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              <Chip
                label={insight.priority}
                size="small"
                sx={{
                  backgroundColor: getPriorityColor(insight.priority),
                  color: 'white',
                  textTransform: 'capitalize',
                  fontWeight: 'medium'
                }}
              />
              
              {showCategory && (
                <Chip
                  icon={getCategoryIcon()}
                  label={insight.category.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              )}
              
              <Chip
                label={`${insight.confidence}% confidence`}
                size="small"
                variant="outlined"
                color={insight.confidence >= 80 ? 'success' : insight.confidence >= 60 ? 'warning' : 'default'}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getTrendIcon(insight.trend)}
            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Summary */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: compact ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {insight.summary}
        </Typography>

        {/* Chart Visualization */}
        {insight.chartData && (
          <Box sx={{ 
            mb: 2, 
            height: compact ? 80 : 140,
            position: 'relative',
            backgroundColor: 'grey.50',
            borderRadius: 1,
            p: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            {renderChart()}
            
            {/* Chart Type Indicator */}
            <Box sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              px: 1,
              py: 0.5,
              boxShadow: 1
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {insight.chartData.type.toUpperCase()}
              </Typography>
            </Box>
            
            {/* Data Source Indicator */}
            <Box sx={{ 
              position: 'absolute', 
              bottom: 4, 
              left: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <Box sx={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                backgroundColor: insight.confidence >= 80 ? '#4caf50' : 
                                insight.confidence >= 60 ? '#ff9800' : '#f44336'
              }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                AI Generated
              </Typography>
            </Box>
          </Box>
        )}

        {/* Confidence Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              AI Confidence
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {insight.confidence}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={insight.confidence} 
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: insight.confidence >= 80 ? '#4caf50' : 
                                insight.confidence >= 60 ? '#ff9800' : '#f44336'
              }
            }}
          />
        </Box>

        {/* Key Metrics */}
        {!compact && insight.metrics.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Key Metrics
            </Typography>
            {insight.metrics.slice(0, 2).map((metric, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {metric.name}:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formatMetricValue(metric.value, metric.format, metric.unit)}
                  </Typography>
                  {metric.change && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      {getTrendIcon(metric.changeType || 'stable')}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: metric.changeType === 'up' ? '#4caf50' : 
                                 metric.changeType === 'down' ? '#f44336' : 'text.secondary'
                        }}
                      >
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Recommendations Count */}
        {insight.recommendations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`${insight.recommendations.length} recommendation${insight.recommendations.length !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onClick(insight);
            }}
            sx={{ 
              fontSize: '0.75rem',
              minWidth: 'auto',
              flex: 1
            }}
          >
            View Details
          </Button>
          
          {insight.explanation && (
            <ExplanationTooltip
              title="What does this mean?"
              content={insight.explanation}
              placement="top"
              maxWidth={500}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<HelpIcon />}
                onClick={(e) => e.stopPropagation()}
                sx={{ 
                  fontSize: '0.75rem',
                  minWidth: 'auto',
                  flex: 1
                }}
              >
                Explain
              </Button>
            </ExplanationTooltip>
          )}
          
          {/* Quick Actions for Recommendations */}
          {insight.recommendations.length > 0 && (
            <ExplanationTooltip
              title="AI Recommendations"
              content={`${insight.recommendations.length} recommendation${insight.recommendations.length !== 1 ? 's' : ''} available. Click "View Details" to see all recommendations and take action.`}
              placement="top"
            >
              <Button
                size="small"
                variant="text"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(insight);
                }}
                sx={{ 
                  fontSize: '0.75rem',
                  minWidth: 'auto',
                  textTransform: 'none'
                }}
              >
                {insight.recommendations.length} Action{insight.recommendations.length !== 1 ? 's' : ''}
              </Button>
            </ExplanationTooltip>
          )}
        </Box>

        {/* Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {insight.tags.slice(0, compact ? 2 : 3).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          ))}
          {insight.tags.length > (compact ? 2 : 3) && (
            <Chip
              label={`+${insight.tags.length - (compact ? 2 : 3)}`}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          )}
        </Box>

        {/* Timestamp */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            textAlign: 'right',
            opacity: 0.7
          }}
        >
          {insight.timestamp.toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default InsightCard;