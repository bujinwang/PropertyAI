export interface BuildingHealth {
  overallScore: number;
  categories: HealthCategory[];
  hotspots: MaintenanceHotspot[];
  predictiveAlerts: PredictiveAlert[];
  recommendations: AIRecommendation[];
  lastUpdated: Date;
}

export interface HealthCategory {
  name: string;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  factors: string[];
  status: 'good' | 'warning' | 'critical';
}

export interface MaintenanceHotspot {
  id: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  frequency: number;
  lastIncident: Date;
  coordinates: [number, number];
  issueType: string;
  description: string;
}

export interface PredictiveAlert {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  estimatedDate: Date;
  category: string;
  recommendedActions: string[];
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  estimatedCost?: number;
  estimatedSavings?: number;
  timeline: string;
  category: string;
}

export interface BuildingSystem {
  id: string;
  name: string;
  status: 'operational' | 'warning' | 'critical' | 'offline';
  lastMaintenance: Date;
  nextMaintenance: Date;
  efficiency: number;
  alerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
}