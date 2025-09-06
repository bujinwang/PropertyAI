// PropertyFlow AI Data Visualization Types
// Type definitions for charts, data, and visualization components

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'heatmap' | 'gauge';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export type DataPoint = {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
};

export type SeriesData = {
  name: string;
  data: DataPoint[];
  color?: string;
  type?: ChartType;
  visible?: boolean;
  metadata?: Record<string, any>;
};

export type ChartData = {
  series: SeriesData[];
  categories?: string[];
  metadata?: {
    title?: string;
    subtitle?: string;
    source?: string;
    lastUpdated?: Date;
    [key: string]: any;
  };
};

export interface ChartConfig {
  type: ChartType;
  responsive?: boolean;
  animated?: boolean;
  interactive?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  stacked?: boolean;
  normalized?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  colorScheme?: string[];
  width?: number | string;
  height?: number | string;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface ChartProps extends ChartConfig {
  data: ChartData;
  loading?: boolean;
  error?: string | null;
  onDataPointClick?: (dataPoint: DataPoint, seriesIndex: number) => void;
  onLegendClick?: (seriesName: string, visible: boolean) => void;
  className?: string;
  'data-testid'?: string;
}

// Property-specific data types
export interface PropertyMetrics {
  propertyId: string;
  propertyName: string;
  revenue: number;
  expenses: number;
  occupancyRate: number;
  averageRent: number;
  netOperatingIncome: number;
  capRate: number;
  cashFlow: number;
  period: string | Date;
  metadata?: Record<string, any>;
}

export interface TenantMetrics {
  tenantId?: string;
  demographics: {
    ageGroup: string;
    income: number;
    pets: boolean;
    familySize: number;
  };
  satisfaction: {
    overall: number;
    maintenance: number;
    communication: number;
    value: number;
  };
  leaseData: {
    rentAmount: number;
    leaseLength: number;
    renewalProbability: number;
  };
  period: string | Date;
}

export interface MaintenanceMetrics {
  requestId?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  cost: number;
  responseTime: number; // hours
  resolutionTime: number; // hours
  satisfaction?: number;
  createdDate: Date;
  resolvedDate?: Date;
  propertyId: string;
}

export interface FinancialMetrics {
  income: {
    rent: number;
    fees: number;
    other: number;
  };
  expenses: {
    maintenance: number;
    utilities: number;
    insurance: number;
    taxes: number;
    management: number;
    marketing: number;
    other: number;
  };
  period: string | Date;
  propertyId?: string;
}

// Dashboard and widget types
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidget {
  id: string;
  title: string;
  type: ChartType | 'kpi' | 'table' | 'custom';
  size: WidgetSize;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: ChartConfig;
  dataSource: string;
  refreshInterval?: number; // minutes
  filters?: Record<string, any>;
  permissions?: string[];
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'masonry' | 'flex';
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// Analysis and insights types
export interface DataInsight {
  type: 'trend' | 'anomaly' | 'pattern' | 'forecast';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations?: string[];
  metadata: {
    dataPoints: DataPoint[];
    timeframe: TimeRange;
    algorithm?: string;
  };
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // percentage change
  period: TimeRange;
  significance: number; // 0-1
  prediction?: {
    nextPeriod: number;
    confidence: number;
  };
}

// Export and sharing types
export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'xlsx';
  quality?: 'low' | 'medium' | 'high';
  includeData?: boolean;
  includeMetadata?: boolean;
  customFileName?: string;
}

export interface ShareOptions {
  type: 'link' | 'embed' | 'email';
  permissions: 'view' | 'edit' | 'admin';
  expiration?: Date;
  password?: string;
  recipients?: string[];
}

// Accessibility and internationalization
export interface A11yConfig {
  announceDataChanges: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  alternativeTextEnabled: boolean;
}

// Property management specific enums and constants
export const PROPERTY_METRICS_TYPES = {
  FINANCIAL: 'financial',
  OCCUPANCY: 'occupancy',
  MAINTENANCE: 'maintenance',
  TENANT_SATISFACTION: 'tenant_satisfaction',
  MARKET_COMPARISON: 'market_comparison',
} as const;

export const TIME_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export const CHART_THEMES = {
  PROPERTYFLOW: 'propertyflow',
  PROFESSIONAL: 'professional',
  MINIMAL: 'minimal',
  COLORFUL: 'colorful',
} as const;

export const DEFAULT_COLORS = [
  '#2563eb', // Primary blue
  '#10b981', // Success green
  '#f59e0b', // Warning orange
  '#ef4444', // Error red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6b7280', // Gray
] as const;

export type PropertyMetricsType = keyof typeof PROPERTY_METRICS_TYPES;
export type TimePeriod = keyof typeof TIME_PERIODS;
export type ChartTheme = keyof typeof CHART_THEMES;