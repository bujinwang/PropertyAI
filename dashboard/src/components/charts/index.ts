/**
 * Chart Components Index
 *
 * Centralized exports for all data visualization components
 */

export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';
export { default as PieChart } from './PieChart';
export { default as GaugeChart } from './GaugeChart';
export { default as HeatMap } from './HeatMap';

// Re-export types for convenience
export type { default as LineChartProps } from './LineChart';
export type { default as BarChartProps } from './BarChart';
export type { default as PieChartProps } from './PieChart';
export type { default as GaugeChartProps } from './GaugeChart';
export type { default as HeatMapProps } from './HeatMap';

// Common chart types
export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color: string;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  title?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  className?: string;
}

// Utility functions for chart data manipulation
export const formatChartValue = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

export const generateColorPalette = (count: number): string[] => {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  const palette: string[] = [];
  for (let i = 0; i < count; i++) {
    palette.push(colors[i % colors.length]);
  }

  return palette;
};

export const normalizeData = (data: number[]): number[] => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  if (range === 0) return data.map(() => 0.5);

  return data.map(value => (value - min) / range);
};

export const calculateMovingAverage = (data: number[], window: number = 7): number[] => {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const end = i + 1;
    const windowData = data.slice(start, end);
    const average = windowData.reduce((sum, val) => sum + val, 0) / windowData.length;
    result.push(average);
  }

  return result;
};