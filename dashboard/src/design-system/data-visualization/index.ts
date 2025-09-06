// PropertyFlow AI Data Visualization - Main Export
// Central access point for all chart components, hooks, and utilities

// Core types
export * from './types';

// Chart components
export { LineChart } from './components/LineChart';
export { BarChart } from './components/BarChart';
export { PieChart } from './components/PieChart';

// Component prop types
export type { LineChartProps } from './components/LineChart';
export type { BarChartProps } from './components/BarChart';
export type { PieChartProps } from './components/PieChart';

// Utility functions for data transformation
export const transformDataForChart = (rawData: any[], config: {
  xField: string;
  yField: string;
  seriesField?: string;
  labelField?: string;
}): any => {
  const { xField, yField, seriesField, labelField } = config;
  
  if (!seriesField) {
    // Single series
    return {
      series: [{
        name: 'Data',
        data: rawData.map(item => ({
          x: item[xField],
          y: item[yField],
          label: labelField ? item[labelField] : undefined,
        }))
      }]
    };
  } else {
    // Multiple series
    const seriesMap = new Map();
    
    rawData.forEach(item => {
      const seriesName = item[seriesField];
      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, []);
      }
      seriesMap.get(seriesName).push({
        x: item[xField],
        y: item[yField],
        label: labelField ? item[labelField] : undefined,
      });
    });
    
    return {
      series: Array.from(seriesMap.entries()).map(([name, data]) => ({
        name,
        data
      }))
    };
  }
};

// PropertyFlow AI specific data generators (for demo purposes)
export const generatePropertyRevenueData = (months: number = 12) => {
  const data = [];
  const baseRevenue = 50000;
  const currentDate = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const seasonalMultiplier = 1 + 0.1 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
    const randomVariation = 0.9 + Math.random() * 0.2;
    
    data.push({
      x: date.toISOString().slice(0, 7), // YYYY-MM format
      y: Math.round(baseRevenue * seasonalMultiplier * randomVariation),
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });
  }
  
  return {
    series: [{
      name: 'Monthly Revenue',
      data,
      color: '#2563eb'
    }],
    metadata: {
      title: 'Property Revenue Trend',
      subtitle: `Revenue over the last ${months} months`,
      source: 'PropertyFlow AI Analytics',
      lastUpdated: new Date(),
    }
  };
};

export const generateExpenseBreakdownData = () => {
  const expenses = [
    { category: 'Maintenance', amount: 15000 },
    { category: 'Utilities', amount: 8000 },
    { category: 'Insurance', amount: 5000 },
    { category: 'Property Tax', amount: 12000 },
    { category: 'Management Fees', amount: 6000 },
    { category: 'Marketing', amount: 3000 },
    { category: 'Other', amount: 2000 },
  ];
  
  return {
    series: [{
      name: 'Expenses',
      data: expenses.map((expense, index) => ({
        x: expense.category,
        y: expense.amount,
        label: expense.category,
        color: [
          '#ef4444', // Red for maintenance
          '#f59e0b', // Orange for utilities
          '#10b981', // Green for insurance
          '#3b82f6', // Blue for tax
          '#8b5cf6', // Purple for management
          '#06b6d4', // Cyan for marketing
          '#6b7280', // Gray for other
        ][index]
      }))
    }],
    metadata: {
      title: 'Monthly Expense Breakdown',
      subtitle: 'Distribution of property expenses by category',
      source: 'PropertyFlow AI Financial Tracking',
      lastUpdated: new Date(),
    }
  };
};

export const generateOccupancyTrendData = (months: number = 12) => {
  const data = [];
  const currentDate = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const baseOccupancy = 85; // 85% base occupancy
    const seasonalEffect = 5 * Math.sin(((date.getMonth() + 3) / 12) * 2 * Math.PI); // Higher in summer
    const randomVariation = (Math.random() - 0.5) * 10;
    const occupancy = Math.max(60, Math.min(100, baseOccupancy + seasonalEffect + randomVariation));
    
    data.push({
      x: date.toISOString().slice(0, 7),
      y: Math.round(occupancy * 10) / 10, // Round to 1 decimal
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });
  }
  
  return {
    series: [{
      name: 'Occupancy Rate (%)',
      data,
      color: '#10b981'
    }],
    metadata: {
      title: 'Property Occupancy Rate',
      subtitle: `Occupancy percentage over the last ${months} months`,
      source: 'PropertyFlow AI Leasing Analytics',
      lastUpdated: new Date(),
    }
  };
};

export const generateMaintenanceMetricsData = () => {
  const categories = [
    'Plumbing', 'Electrical', 'HVAC', 'Appliances', 
    'Painting', 'Flooring', 'Landscaping', 'Security'
  ];
  
  const data = [];
  const currentDate = new Date();
  
  // Generate data for each month over the last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 7);
    
    categories.forEach(category => {
      const requestCount = Math.floor(Math.random() * 20) + 5; // 5-25 requests
      const avgCost = Math.floor((Math.random() * 500 + 100) * requestCount); // $100-600 per request
      
      data.push({
        month: monthStr,
        category,
        requests: requestCount,
        totalCost: avgCost,
        avgResponseTime: Math.floor(Math.random() * 12) + 2, // 2-14 hours
      });
    });
  }
  
  return data;
};

// Chart theme configurations
export const CHART_THEMES = {
  propertyflow: {
    colors: [
      '#2563eb', '#10b981', '#f59e0b', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ],
    grid: { strokeDasharray: '3 3', opacity: 0.3 },
    background: 'var(--color-background-paper)',
    textColor: 'var(--color-text-primary)',
  },
  
  professional: {
    colors: [
      '#1f2937', '#374151', '#6b7280', '#9ca3af',
      '#d1d5db', '#e5e7eb', '#f3f4f6', '#ffffff'
    ],
    grid: { strokeDasharray: '1 1', opacity: 0.2 },
    background: '#ffffff',
    textColor: '#1f2937',
  },
  
  colorful: {
    colors: [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
    ],
    grid: { strokeDasharray: '5 5', opacity: 0.4 },
    background: 'var(--color-background-paper)',
    textColor: 'var(--color-text-primary)',
  },
} as const;

// Common chart configurations
export const DEFAULT_CHART_CONFIG = {
  responsive: true,
  animated: true,
  interactive: true,
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  colorScheme: CHART_THEMES.propertyflow.colors,
  height: 400,
} as const;

// Utility functions for formatting
export const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

export const formatPercentage = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
  }).format(value);
};

// Color utility functions
export const getChartColor = (index: number, theme = 'propertyflow') => {
  const colors = CHART_THEMES[theme as keyof typeof CHART_THEMES]?.colors || CHART_THEMES.propertyflow.colors;
  return colors[index % colors.length];
};

export const generateColorPalette = (count: number, theme = 'propertyflow') => {
  const colors = CHART_THEMES[theme as keyof typeof CHART_THEMES]?.colors || CHART_THEMES.propertyflow.colors;
  const palette = [];
  
  for (let i = 0; i < count; i++) {
    palette.push(colors[i % colors.length]);
  }
  
  return palette;
};