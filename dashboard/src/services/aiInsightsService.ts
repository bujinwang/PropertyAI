/**
 * AI Insights Service
 * Service for fetching and managing AI insights data
 */

import { 
  Insight, 
  InsightCategoryGroup, 
  InsightsResponse, 
  InsightFilters, 
  AIRecommendation,
  TimeRange,
  InsightCategory,
  ChartData
} from '../types/ai-insights';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Mock data for development
 */
const mockInsights: Insight[] = [
  {
    id: '1',
    title: 'Rent Collection Efficiency Declining',
    summary: 'Late payments have increased by 15% over the past month, indicating potential tenant financial stress.',
    category: 'financial',
    priority: 'high',
    impact: 'high',
    confidence: 85,
    explanation: {
      title: 'Rent Collection Analysis',
      content: 'Analysis of payment patterns shows increasing delays and partial payments.',
      factors: [
        {
          name: 'Late Payment Frequency',
          value: '15% increase',
          weight: 0.4,
          description: 'More tenants paying after due date',
          impact: 'negative'
        },
        {
          name: 'Partial Payments',
          value: '8% increase',
          weight: 0.3,
          description: 'Increase in partial payment requests',
          impact: 'negative'
        }
      ]
    },
    recommendations: [
      {
        id: 'rec1',
        title: 'Implement Payment Reminders',
        description: 'Set up automated payment reminders 3 days before due date',
        priority: 'high',
        confidence: 90,
        estimatedImpact: '10-15% reduction in late payments',
        timeline: '2 weeks',
        effort: 'low',
        category: 'automation',
        actions: [
          {
            id: 'action1',
            description: 'Configure automated reminder system',
            completed: false,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ],
    chartData: {
      type: 'line',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'On-time Payments (%)',
          data: [95, 93, 91, 88, 85, 82],
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          fill: true
        }
      ]
    },
    metrics: [
      {
        name: 'Collection Rate',
        value: 82,
        unit: '%',
        change: -15,
        changeType: 'down',
        target: 95,
        format: 'percentage'
      }
    ],
    timestamp: new Date(),
    trend: 'down',
    tags: ['payments', 'collections', 'financial']
  },
  {
    id: '2',
    title: 'Maintenance Response Time Improving',
    summary: 'Average response time to maintenance requests has decreased by 20% this quarter.',
    category: 'operational',
    priority: 'medium',
    impact: 'medium',
    confidence: 92,
    explanation: {
      title: 'Maintenance Efficiency Analysis',
      content: 'Improved scheduling and vendor coordination has reduced response times.',
      factors: [
        {
          name: 'Average Response Time',
          value: '2.4 hours',
          weight: 0.5,
          description: 'Time from request to initial response',
          impact: 'positive'
        }
      ]
    },
    recommendations: [
      {
        id: 'rec2',
        title: 'Expand Preventive Maintenance',
        description: 'Increase preventive maintenance to reduce emergency requests',
        priority: 'medium',
        confidence: 85,
        estimatedImpact: '25% reduction in emergency requests',
        timeline: '1 month',
        effort: 'medium',
        category: 'maintenance',
        actions: [
          {
            id: 'action2',
            description: 'Schedule quarterly HVAC inspections',
            completed: false
          }
        ]
      }
    ],
    chartData: {
      type: 'bar',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Response Time (hours)',
          data: [3.2, 2.8, 2.4, 2.1],
          backgroundColor: '#4caf50'
        }
      ]
    },
    metrics: [
      {
        name: 'Avg Response Time',
        value: 2.4,
        unit: 'hours',
        change: -20,
        changeType: 'down',
        target: 2.0,
        format: 'number'
      }
    ],
    timestamp: new Date(),
    trend: 'up',
    tags: ['maintenance', 'efficiency', 'operations']
  },
  {
    id: '3',
    title: 'Tenant Satisfaction Scores Rising',
    summary: 'Overall tenant satisfaction has increased by 12% following recent improvements.',
    category: 'tenant_satisfaction',
    priority: 'medium',
    impact: 'high',
    confidence: 88,
    explanation: {
      title: 'Satisfaction Survey Analysis',
      content: 'Recent improvements in communication and maintenance have boosted satisfaction.',
      factors: [
        {
          name: 'Communication Rating',
          value: '4.2/5',
          weight: 0.3,
          description: 'Tenant rating of management communication',
          impact: 'positive'
        },
        {
          name: 'Maintenance Rating',
          value: '4.0/5',
          weight: 0.4,
          description: 'Tenant rating of maintenance services',
          impact: 'positive'
        }
      ]
    },
    recommendations: [
      {
        id: 'rec3',
        title: 'Launch Tenant Feedback Program',
        description: 'Implement regular feedback collection to maintain satisfaction levels',
        priority: 'low',
        confidence: 75,
        estimatedImpact: 'Sustained high satisfaction',
        timeline: '3 weeks',
        effort: 'low',
        category: 'engagement',
        actions: [
          {
            id: 'action3',
            description: 'Set up monthly satisfaction surveys',
            completed: false
          }
        ]
      }
    ],
    chartData: {
      type: 'doughnut',
      labels: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'],
      datasets: [
        {
          data: [45, 35, 15, 5],
          backgroundColor: ['#4caf50', '#8bc34a', '#ffc107', '#f44336']
        }
      ]
    },
    metrics: [
      {
        name: 'Satisfaction Score',
        value: 4.1,
        unit: '/5',
        change: 12,
        changeType: 'up',
        target: 4.5,
        format: 'number'
      }
    ],
    timestamp: new Date(),
    trend: 'up',
    tags: ['satisfaction', 'surveys', 'tenants']
  }
];

const mockCategories: InsightCategoryGroup[] = [
  {
    id: 'financial',
    name: 'Financial Insights',
    category: 'financial',
    insights: mockInsights.filter(i => i.category === 'financial'),
    totalCount: 1,
    priority: 1,
    icon: 'AttachMoney',
    color: '#4caf50'
  },
  {
    id: 'operational',
    name: 'Operational Insights',
    category: 'operational',
    insights: mockInsights.filter(i => i.category === 'operational'),
    totalCount: 1,
    priority: 2,
    icon: 'Settings',
    color: '#2196f3'
  },
  {
    id: 'tenant_satisfaction',
    name: 'Tenant Satisfaction',
    category: 'tenant_satisfaction',
    insights: mockInsights.filter(i => i.category === 'tenant_satisfaction'),
    totalCount: 1,
    priority: 3,
    icon: 'People',
    color: '#ff9800'
  }
];

class AIInsightsService {
  /**
   * Fetch insights with filtering and pagination
   */
  async getInsights(filters?: Partial<InsightFilters>): Promise<InsightsResponse> {
    try {
      // In production, this would be an API call
      // const response = await fetch(`${API_BASE_URL}/api/ai/insights`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(filters)
      // });
      
      // For now, return mock data with filtering
      let filteredInsights = [...mockInsights];
      
      if (filters?.categories?.length) {
        filteredInsights = filteredInsights.filter(insight => 
          filters.categories!.includes(insight.category)
        );
      }
      
      if (filters?.priorities?.length) {
        filteredInsights = filteredInsights.filter(insight => 
          filters.priorities!.includes(insight.priority)
        );
      }
      
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredInsights = filteredInsights.filter(insight => 
          insight.title.toLowerCase().includes(query) ||
          insight.summary.toLowerCase().includes(query) ||
          insight.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Sort insights
      if (filters?.sortBy) {
        filteredInsights.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sortBy) {
            case 'priority':
              const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
              aValue = priorityOrder[a.priority];
              bValue = priorityOrder[b.priority];
              break;
            case 'confidence':
              aValue = a.confidence;
              bValue = b.confidence;
              break;
            case 'impact':
              const impactOrder = { high: 3, medium: 2, low: 1 };
              aValue = impactOrder[a.impact];
              bValue = impactOrder[b.impact];
              break;
            case 'timestamp':
              aValue = a.timestamp.getTime();
              bValue = b.timestamp.getTime();
              break;
            default:
              return 0;
          }
          
          const result = aValue - bValue;
          return filters.sortOrder === 'desc' ? -result : result;
        });
      }
      
      return {
        insights: filteredInsights,
        categories: mockCategories,
        totalCount: filteredInsights.length,
        hasMore: false
      };
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw new Error('Failed to fetch insights');
    }
  }

  /**
   * Get insight by ID
   */
  async getInsightById(id: string): Promise<Insight | null> {
    try {
      // In production: const response = await fetch(`${API_BASE_URL}/api/ai/insights/${id}`);
      return mockInsights.find(insight => insight.id === id) || null;
    } catch (error) {
      console.error('Error fetching insight:', error);
      throw new Error('Failed to fetch insight');
    }
  }

  /**
   * Get insights by category
   */
  async getInsightsByCategory(category: InsightCategory): Promise<Insight[]> {
    try {
      const response = await this.getInsights({ categories: [category] });
      return response.insights;
    } catch (error) {
      console.error('Error fetching insights by category:', error);
      throw new Error('Failed to fetch insights by category');
    }
  }

  /**
   * Update recommendation action status
   */
  async updateRecommendationAction(
    insightId: string, 
    recommendationId: string, 
    actionId: string, 
    completed: boolean
  ): Promise<void> {
    try {
      // In production: API call to update action status
      console.log('Updating recommendation action:', { insightId, recommendationId, actionId, completed });
    } catch (error) {
      console.error('Error updating recommendation action:', error);
      throw new Error('Failed to update recommendation action');
    }
  }

  /**
   * Submit feedback for insight
   */
  async submitInsightFeedback(insightId: string, feedback: any): Promise<void> {
    try {
      // In production: API call to submit feedback
      console.log('Submitting insight feedback:', { insightId, feedback });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get dashboard summary metrics
   */
  async getDashboardSummary(): Promise<any> {
    try {
      const totalInsights = mockInsights.length;
      const highPriorityCount = mockInsights.filter(i => i.priority === 'high' || i.priority === 'critical').length;
      const avgConfidence = mockInsights.reduce((sum, i) => sum + i.confidence, 0) / totalInsights;
      
      return {
        totalInsights,
        highPriorityCount,
        avgConfidence: Math.round(avgConfidence),
        categoryCounts: {
          financial: mockInsights.filter(i => i.category === 'financial').length,
          operational: mockInsights.filter(i => i.category === 'operational').length,
          tenant_satisfaction: mockInsights.filter(i => i.category === 'tenant_satisfaction').length
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw new Error('Failed to fetch dashboard summary');
    }
  }
}

export const aiInsightsService = new AIInsightsService();
export default aiInsightsService;