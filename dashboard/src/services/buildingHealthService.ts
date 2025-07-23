import { 
  BuildingHealth, 
  HealthCategory, 
  MaintenanceHotspot, 
  PredictiveAlert, 
  AIRecommendation,
  BuildingSystem 
} from '../types/building-health';

// Mock data for development
const mockBuildingHealth: BuildingHealth = {
  overallScore: 78,
  categories: [
    {
      name: 'HVAC System',
      score: 85,
      trend: 'stable',
      factors: ['Temperature control', 'Air quality', 'Energy efficiency'],
      status: 'good'
    },
    {
      name: 'Plumbing',
      score: 65,
      trend: 'declining',
      factors: ['Water pressure', 'Leak detection', 'Pipe condition'],
      status: 'warning'
    },
    {
      name: 'Electrical',
      score: 45,
      trend: 'declining',
      factors: ['Voltage stability', 'Circuit load', 'Safety compliance'],
      status: 'critical'
    },
    {
      name: 'Structural',
      score: 90,
      trend: 'stable',
      factors: ['Foundation', 'Walls', 'Roof condition'],
      status: 'good'
    },
    {
      name: 'Security Systems',
      score: 88,
      trend: 'improving',
      factors: ['Access control', 'Surveillance', 'Alarm systems'],
      status: 'good'
    }
  ],
  hotspots: [
    {
      id: '1',
      location: 'Building A - 3rd Floor',
      severity: 'high',
      frequency: 8,
      lastIncident: new Date('2024-01-15'),
      coordinates: [40.7128, -74.0060],
      issueType: 'Electrical',
      description: 'Frequent power outages and voltage fluctuations'
    },
    {
      id: '2',
      location: 'Building B - Basement',
      severity: 'medium',
      frequency: 5,
      lastIncident: new Date('2024-01-10'),
      coordinates: [40.7130, -74.0058],
      issueType: 'Plumbing',
      description: 'Water leak in main pipe'
    },
    {
      id: '3',
      location: 'Building A - Roof',
      severity: 'low',
      frequency: 2,
      lastIncident: new Date('2024-01-05'),
      coordinates: [40.7126, -74.0062],
      issueType: 'HVAC',
      description: 'Minor ventilation issues'
    }
  ],
  predictiveAlerts: [
    {
      id: '1',
      title: 'HVAC Filter Replacement Due',
      description: 'Based on usage patterns, HVAC filters will need replacement within 2 weeks',
      priority: 'medium',
      confidence: 0.85,
      estimatedDate: new Date('2024-02-01'),
      category: 'HVAC',
      recommendedActions: ['Schedule filter replacement', 'Order new filters', 'Notify maintenance team']
    },
    {
      id: '2',
      title: 'Electrical Panel Inspection Required',
      description: 'Voltage fluctuations indicate potential electrical panel issues',
      priority: 'high',
      confidence: 0.92,
      estimatedDate: new Date('2024-01-25'),
      category: 'Electrical',
      recommendedActions: ['Schedule electrical inspection', 'Contact certified electrician', 'Prepare for potential downtime']
    },
    {
      id: '3',
      title: 'Plumbing Maintenance Recommended',
      description: 'Water pressure trends suggest preventive maintenance needed',
      priority: 'low',
      confidence: 0.73,
      estimatedDate: new Date('2024-02-15'),
      category: 'Plumbing',
      recommendedActions: ['Schedule plumbing inspection', 'Check water pressure regulators']
    }
  ],
  recommendations: [
    {
      id: '1',
      title: 'Upgrade Electrical Infrastructure',
      description: 'Installing modern electrical panels will improve safety and reduce maintenance costs',
      confidence: 0.88,
      priority: 'high',
      estimatedCost: 15000,
      estimatedSavings: 5000,
      timeline: '2-3 weeks',
      category: 'Electrical'
    },
    {
      id: '2',
      title: 'Implement Smart HVAC Controls',
      description: 'Smart thermostats and sensors can optimize energy usage and improve comfort',
      confidence: 0.79,
      priority: 'medium',
      estimatedCost: 8000,
      estimatedSavings: 3000,
      timeline: '1-2 weeks',
      category: 'HVAC'
    }
  ],
  lastUpdated: new Date()
};

const mockBuildingSystems: BuildingSystem[] = [
  {
    id: '1',
    name: 'HVAC System',
    status: 'operational',
    lastMaintenance: new Date('2024-01-01'),
    nextMaintenance: new Date('2024-04-01'),
    efficiency: 85,
    alerts: [
      {
        id: '1',
        message: 'Filter replacement due soon',
        severity: 'warning',
        timestamp: new Date('2024-01-15')
      }
    ]
  },
  {
    id: '2',
    name: 'Plumbing System',
    status: 'warning',
    lastMaintenance: new Date('2023-12-15'),
    nextMaintenance: new Date('2024-03-15'),
    efficiency: 65,
    alerts: [
      {
        id: '2',
        message: 'Minor leak detected in basement',
        severity: 'warning',
        timestamp: new Date('2024-01-10')
      }
    ]
  },
  {
    id: '3',
    name: 'Electrical System',
    status: 'critical',
    lastMaintenance: new Date('2023-11-01'),
    nextMaintenance: new Date('2024-02-01'),
    efficiency: 45,
    alerts: [
      {
        id: '3',
        message: 'Voltage fluctuation detected',
        severity: 'error',
        timestamp: new Date('2024-01-12')
      }
    ]
  }
];

export class BuildingHealthService {
  static async getBuildingHealth(): Promise<BuildingHealth> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockBuildingHealth;
  }

  static async getBuildingSystems(): Promise<BuildingSystem[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockBuildingSystems;
  }

  static async getHealthMetrics(timeRange: '7d' | '30d' | '90d' = '30d') {
    // Simulate API call for historical data
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const generateTrendData = (baseValue: number, days: number) => {
      const data = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = (Math.random() - 0.5) * 10;
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.max(0, Math.min(100, baseValue + variation))
        });
      }
      return data;
    };

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    return {
      overallScore: generateTrendData(78, days),
      hvac: generateTrendData(85, days),
      plumbing: generateTrendData(65, days),
      electrical: generateTrendData(45, days),
      structural: generateTrendData(90, days),
      security: generateTrendData(88, days)
    };
  }

  static async updateSystemStatus(systemId: string, status: BuildingSystem['status']): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Updated system ${systemId} status to ${status}`);
  }

  static async acknowledgeAlert(alertId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Acknowledged alert ${alertId}`);
  }
}