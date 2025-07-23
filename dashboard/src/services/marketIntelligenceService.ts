/**
 * Market Intelligence Service
 * Handles API calls for market data, competitor analysis, and AI summaries
 */

import { 
  MarketIntelligence, 
  MarketIntelligenceResponse,
  AISummary,
  CompetitorData,
  MarketOpportunity,
  MarketTrend,
  DemandForecast
} from '../types/market-intelligence';
import { ConfidenceScore } from '../types/ai';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Fetch complete market intelligence data
 */
export const fetchMarketIntelligence = async (): Promise<MarketIntelligenceResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market-intelligence`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
};

/**
 * Fetch AI-generated market summary
 */
export const fetchMarketSummary = async (): Promise<AISummary> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market-intelligence/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market summary:', error);
    // Return mock data for development
    return getMockMarketSummary();
  }
};

/**
 * Fetch competitor activity data
 */
export const fetchCompetitorActivity = async (): Promise<CompetitorData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market-intelligence/competitors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching competitor activity:', error);
    // Return mock data for development
    return getMockCompetitorData();
  }
};

/**
 * Fetch market opportunities
 */
export const fetchMarketOpportunities = async (): Promise<MarketOpportunity[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market-intelligence/opportunities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market opportunities:', error);
    // Return mock data for development
    return getMockMarketOpportunities();
  }
};

/**
 * Fetch market trends data
 */
export const fetchMarketTrends = async (): Promise<MarketTrend[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market-intelligence/trends`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market trends:', error);
    // Return mock data for development
    return getMockMarketTrends();
  }
};

/**
 * Fetch demand forecasts
 */
export const fetchDemandForecasts = async (): Promise<DemandForecast[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market-intelligence/forecasts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching demand forecasts:', error);
    // Return mock data for development
    return getMockDemandForecasts();
  }
};

/**
 * Submit feedback for AI-generated content
 */
export const submitMarketFeedback = async (
  contentId: string,
  feedback: { type: 'positive' | 'negative'; comment?: string }
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market-intelligence/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        contentId,
        feedback,
        timestamp: new Date(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error submitting market feedback:', error);
    return false;
  }
};

// Mock data for development and testing
const getMockMarketSummary = (): AISummary => ({
  id: 'summary-1',
  title: 'Market Intelligence Summary',
  content: 'Current market conditions show strong rental demand with moderate price growth. Competition is increasing in the downtown area.',
  confidence: 85,
  timestamp: new Date(),
  explanation: 'Analysis based on 30-day rolling average of market data, competitor pricing, and demand indicators.',
  keyInsights: [
    'Rental demand increased 12% compared to last month',
    'Average rent prices up 3.5% year-over-year',
    'Vacancy rates decreased to 4.2% from 5.1%',
    'New competitor entered downtown market with premium pricing'
  ],
  marketCondition: 'favorable',
  recommendations: [
    {
      id: 'rec-1',
      title: 'Optimize Pricing Strategy',
      description: 'Consider 2-3% rent increase for renewals based on market trends',
      priority: 'high',
      confidence: { value: 88, level: 'high', explanation: 'Strong market data supports pricing adjustment' },
      category: 'pricing',
      timeline: '30 days',
      expectedOutcome: 'Increased revenue by 2-5% with minimal tenant turnover'
    },
    {
      id: 'rec-2',
      title: 'Enhance Amenity Package',
      description: 'Add fitness center access to compete with new downtown properties',
      priority: 'medium',
      confidence: { value: 72, level: 'medium', explanation: 'Amenity gap identified in competitor analysis' },
      category: 'operations',
      timeline: '90 days',
      expectedOutcome: 'Improved tenant retention and competitive positioning'
    }
  ],
  riskFactors: [
    'Potential oversupply in luxury segment',
    'Interest rate changes affecting buyer market',
    'Seasonal demand fluctuations approaching'
  ],
  opportunities: [
    'Underserved mid-market segment',
    'Growing demand for pet-friendly units',
    'Corporate housing partnerships'
  ]
});

const getMockCompetitorData = (): CompetitorData[] => [
  {
    id: 'comp-1',
    name: 'Downtown Luxury Apartments',
    location: [40.7128, -74.0060],
    address: '123 Main St, Downtown',
    rentRange: [2800, 4200],
    occupancyRate: 92,
    amenities: ['Gym', 'Pool', 'Concierge', 'Parking'],
    propertyType: 'Luxury High-rise',
    units: 150,
    marketShare: 8.5,
    recentActivity: [
      {
        id: 'act-1',
        type: 'price_change',
        description: 'Increased rent by 4% for new leases',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        impact: 'positive',
        confidence: 85
      },
      {
        id: 'act-2',
        type: 'promotion',
        description: 'Offering 1 month free rent for 12-month leases',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        impact: 'negative',
        confidence: 78
      }
    ]
  },
  {
    id: 'comp-2',
    name: 'Riverside Gardens',
    location: [40.7589, -73.9851],
    address: '456 River Ave, Midtown',
    rentRange: [2200, 3500],
    occupancyRate: 88,
    amenities: ['Garden', 'Laundry', 'Pet-friendly'],
    propertyType: 'Mid-rise Garden Style',
    units: 80,
    marketShare: 4.2,
    recentActivity: [
      {
        id: 'act-3',
        type: 'renovation',
        description: 'Completed kitchen upgrades in 20 units',
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        impact: 'positive',
        confidence: 92
      }
    ]
  }
];

const getMockMarketOpportunities = (): MarketOpportunity[] => [
  {
    id: 'opp-1',
    title: 'Premium Pet Services Gap',
    description: 'Market analysis shows 68% of renters have pets, but only 23% of properties offer premium pet amenities.',
    type: 'amenity',
    priority: 'high',
    potentialImpact: 'Increase occupancy by 8-12% and justify 5-8% rent premium',
    confidence: { value: 84, level: 'high', explanation: 'Strong correlation between pet amenities and occupancy rates' },
    actionItems: [
      'Install dog washing station',
      'Create dedicated pet play area',
      'Partner with local pet services',
      'Implement pet concierge program'
    ],
    timeline: '60-90 days',
    estimatedROI: 15.2
  },
  {
    id: 'opp-2',
    title: 'Flexible Lease Terms Demand',
    description: 'Growing demand for 6-month and month-to-month leases, especially among young professionals.',
    type: 'pricing',
    priority: 'medium',
    potentialImpact: 'Capture 15% more prospects willing to pay premium for flexibility',
    confidence: { value: 76, level: 'medium', explanation: 'Trend analysis shows increasing demand for flexible terms' },
    actionItems: [
      'Develop flexible lease pricing model',
      'Create short-term lease packages',
      'Market to corporate relocations',
      'Adjust vacancy management strategy'
    ],
    timeline: '30-45 days',
    estimatedROI: 8.7
  },
  {
    id: 'opp-3',
    title: 'Smart Home Technology Integration',
    description: 'Competitor analysis reveals technology gap in current amenity offerings.',
    type: 'amenity',
    priority: 'medium',
    potentialImpact: 'Differentiate from 78% of local competitors lacking smart features',
    confidence: { value: 71, level: 'medium', explanation: 'Technology adoption trends support investment' },
    actionItems: [
      'Install smart thermostats',
      'Implement keyless entry systems',
      'Add smart lighting controls',
      'Integrate property management app'
    ],
    timeline: '90-120 days',
    estimatedROI: 12.4
  }
];

const getMockMarketTrends = (): MarketTrend[] => [
  {
    id: 'trend-1',
    metric: 'Average Rent',
    currentValue: 2850,
    previousValue: 2750,
    change: 100,
    changePercent: 3.6,
    trend: 'up',
    timeframe: 'Last 3 months',
    unit: '$',
    category: 'rent'
  },
  {
    id: 'trend-2',
    metric: 'Vacancy Rate',
    currentValue: 4.2,
    previousValue: 5.1,
    change: -0.9,
    changePercent: -17.6,
    trend: 'down',
    timeframe: 'Last 3 months',
    unit: '%',
    category: 'vacancy'
  },
  {
    id: 'trend-3',
    metric: 'Demand Index',
    currentValue: 78,
    previousValue: 72,
    change: 6,
    changePercent: 8.3,
    trend: 'up',
    timeframe: 'Last 3 months',
    unit: '',
    category: 'demand'
  },
  {
    id: 'trend-4',
    metric: 'Supply Index',
    currentValue: 65,
    previousValue: 68,
    change: -3,
    changePercent: -4.4,
    trend: 'down',
    timeframe: 'Last 3 months',
    unit: '',
    category: 'supply'
  }
];

const getMockDemandForecasts = (): DemandForecast[] => [
  {
    id: 'forecast-1',
    period: 'Q1 2024',
    predictedDemand: 82,
    confidence: { value: 85, level: 'high', explanation: 'Strong historical data and stable market conditions' },
    factors: [
      {
        name: 'Seasonal Patterns',
        impact: 5.2,
        description: 'Spring moving season typically increases demand',
        weight: 0.25
      },
      {
        name: 'Economic Indicators',
        impact: 3.8,
        description: 'Job growth and wage increases support rental demand',
        weight: 0.30
      },
      {
        name: 'Population Growth',
        impact: 2.1,
        description: 'Steady population growth in target demographics',
        weight: 0.20
      },
      {
        name: 'Competitor Activity',
        impact: -1.5,
        description: 'New supply from competitors may reduce demand',
        weight: 0.25
      }
    ],
    seasonalAdjustment: 1.08,
    trendDirection: 'increasing'
  },
  {
    id: 'forecast-2',
    period: 'Q2 2024',
    predictedDemand: 88,
    confidence: { value: 78, level: 'medium', explanation: 'Moderate confidence due to market volatility' },
    factors: [
      {
        name: 'Seasonal Patterns',
        impact: 8.5,
        description: 'Peak moving season drives highest demand',
        weight: 0.25
      },
      {
        name: 'Economic Indicators',
        impact: 4.2,
        description: 'Continued economic growth supports demand',
        weight: 0.30
      },
      {
        name: 'Population Growth',
        impact: 2.8,
        description: 'Summer graduation and job starts increase demand',
        weight: 0.20
      },
      {
        name: 'Competitor Activity',
        impact: -2.1,
        description: 'Additional competitor properties coming online',
        weight: 0.25
      }
    ],
    seasonalAdjustment: 1.15,
    trendDirection: 'increasing'
  },
  {
    id: 'forecast-3',
    period: 'Q3 2024',
    predictedDemand: 75,
    confidence: { value: 72, level: 'medium', explanation: 'Seasonal decline expected with moderate confidence' },
    factors: [
      {
        name: 'Seasonal Patterns',
        impact: -8.2,
        description: 'Summer to fall transition reduces moving activity',
        weight: 0.25
      },
      {
        name: 'Economic Indicators',
        impact: 2.1,
        description: 'Economic conditions remain supportive',
        weight: 0.30
      },
      {
        name: 'Population Growth',
        impact: 1.5,
        description: 'Steady but slower population growth',
        weight: 0.20
      },
      {
        name: 'Competitor Activity',
        impact: -3.8,
        description: 'Peak competitor supply impact',
        weight: 0.25
      }
    ],
    seasonalAdjustment: 0.92,
    trendDirection: 'decreasing'
  },
  {
    id: 'forecast-4',
    period: 'Q4 2024',
    predictedDemand: 68,
    confidence: { value: 65, level: 'medium', explanation: 'Lower confidence due to seasonal and economic uncertainties' },
    factors: [
      {
        name: 'Seasonal Patterns',
        impact: -12.5,
        description: 'Winter season shows lowest rental activity',
        weight: 0.25
      },
      {
        name: 'Economic Indicators',
        impact: 1.2,
        description: 'Economic uncertainty may impact demand',
        weight: 0.30
      },
      {
        name: 'Population Growth',
        impact: 0.8,
        description: 'Minimal population movement in winter',
        weight: 0.20
      },
      {
        name: 'Competitor Activity',
        impact: -2.5,
        description: 'Market stabilization with competitor supply',
        weight: 0.25
      }
    ],
    seasonalAdjustment: 0.85,
    trendDirection: 'decreasing'
  }
];

export default {
  fetchMarketIntelligence,
  fetchMarketSummary,
  fetchCompetitorActivity,
  fetchMarketOpportunities,
  fetchMarketTrends,
  fetchDemandForecasts,
  submitMarketFeedback,
};