/**
 * Property-related types for the PropertyAI system
 */

export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  purchasePrice: number;
  currentValue?: number;
  yearBuilt: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'commercial';
  images?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  propertyId: string;
  type: 'plumbing' | 'electrical' | 'hvac' | 'roofing' | 'appliance' | 'structural' | 'painting' | 'flooring' | 'pest_control' | 'landscaping' | 'security' | 'other';
  description: string;
  date: Date;
  cost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  contractor?: string;
  notes?: string;
  predictedFailure: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketData {
  id: string;
  location: string;
  date: Date;
  averagePrice: number;
  medianPrice: number;
  pricePerSqFt: number;
  inventory: number;
  daysOnMarket: number;
  saleToListRatio: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyConditionScore {
  overall: number;
  factors: Array<{
    feature: string;
    score: number;
    condition: string;
    impact: number;
  }>;
  breakdown: Record<string, number>;
  confidence: number;
}

export interface PredictiveMaintenancePrediction {
  component: string;
  failureProbability: number;
  timeToFailure: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: string[];
  preventiveActions: Array<{
    action: string;
    cost: number;
    effectiveness: number;
    timeline: string;
    priority: string;
  }>;
  costImpact: {
    repairCost: number;
    downtimeCost: number;
    total: number;
  };
  confidence: number;
}

export interface PreventiveAction {
  action: string;
  cost: number;
  effectiveness: number;
  timeline: string;
  priority: 'low' | 'medium' | 'high';
}