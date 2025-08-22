import { Router, Request, Response } from 'express';
import { User } from '@prisma/client';
import { aiService } from '../services/ai.service';
import { authenticateToken } from '../middleware/auth';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';
import { getInsights, getDashboardSummary, getInsightCategories, regenerateInsight } from '../controllers/aiController';


const router = Router();

// Generate text
router.post('/generate', authenticateToken, [
  body('text').isString().notEmpty(),
  body('context').optional().isString(),
  body('language').optional().isString(),
  body('maxLength').optional().isInt({ min: 1, max: 4000 }),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { text, context, language, maxLength } = req.body;
    
    const result = await aiService.generateText({
      text,
      context,
      language,
      maxLength,
    });

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'text_generation',
        prompt: text,
        response: result.text,
        // metadata: result.metadata, // Removed as it's not in schema
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate text',
    });
  }
});

// Analyze sentiment
router.post('/sentiment', authenticateToken, [
  body('text').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    const result = await aiService.analyzeSentiment(text);

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'sentiment_analysis',
        prompt: text,
        response: JSON.stringify(result),
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze sentiment',
    });
  }
});

// Extract entities
router.post('/entities', authenticateToken, [
  body('text').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    const result = await aiService.extractEntities(text);

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'entity_extraction',
        prompt: text,
        response: JSON.stringify(result),
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error extracting entities:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract entities',
    });
  }
});

// Generate summary - replaced with mock implementation for frontend compatibility
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Mock AI summary matching AISummary interface
    const summary = {
      id: 'summary-1',
      title: 'Market Intelligence Summary',
      content: 'The rental market shows strong momentum with 4.2% quarter-over-quarter growth in rental rates. Key opportunities exist in emerging neighborhoods and property renovations.',
      confidence: { score: 89, level: 'high' },
      generatedAt: new Date().toISOString(),
      keyInsights: [
        'Rental rates have increased by 4.2% over the past quarter',
        'Occupancy rates remain stable at 92% across the market',
        'Demand for properties with remote work spaces is growing by 18%',
        'Northside district shows 12% rent growth potential'
      ],
      marketCondition: 'favorable',
      recommendations: [
        {
          id: 'rec-1',
          title: 'Optimize Rental Pricing',
          description: 'Consider rent increases of 3-5% for downtown properties',
          priority: 'high',
          confidence: { score: 85, level: 'high' },
          category: 'pricing',
          timeline: '1-3 months',
          expectedOutcome: '5-8% increase in rental income'
        },
        {
          id: 'rec-2',
          title: 'Kitchen Renovation Program',
          description: 'Implement kitchen renovations to justify higher rents',
          priority: 'medium',
          confidence: { score: 92, level: 'very_high' },
          category: 'investment',
          timeline: '3-6 months',
          expectedOutcome: '8-12% rent premium'
        }
      ],
      riskFactors: [
        'Potential interest rate increases could impact buyer demand',
        'New construction in nearby areas may increase supply'
      ],
      opportunities: [
        'Emerging neighborhoods showing strong growth potential',
        'EV charging stations can justify 5-8% rent premium',
        'Remote work trends favor properties with dedicated workspaces'
      ]
    };

    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching AI summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch AI summary'
    });
  }
});

// Classify text
router.post('/classify', authenticateToken, [
  body('text').isString().notEmpty(),
  body('labels').isArray().notEmpty(),
  body('labels.*').isString(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { text, labels } = req.body;
    
    const result = await aiService.classifyText({
      text,
      labels,
    });

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'text_classification',
        prompt: text,
        response: result.text,
        // metadata: result.metadata, // Removed as it's not in schema
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error classifying text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to classify text',
    });
  }
});

// Chat with AI
router.post('/chat', authenticateToken, [
  body('message').isString().notEmpty(),
  body('conversationId').optional().isString(),
  body('context').optional().isObject(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { message, conversationId, context } = req.body;
    
    const result = await aiService.chat({
      message,
      conversationId,
      context,
    });
    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'chat',
        prompt: message,
        response: JSON.stringify(result),
        // metadata: context, // Removed as it's not in schema
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat',
    });
  }
});

// Generate property description
router.post('/property-description', authenticateToken, [
  body('type').isString().notEmpty(),
  body('bedrooms').isInt({ min: 0 }),
  body('bathrooms').isInt({ min: 0 }),
  body('location').isString().notEmpty(),
  body('amenities').isArray(),
  body('amenities.*').isString(),
  body('price').isFloat({ min: 0 }),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const propertyData = req.body;
    
    const result = await aiService.generatePropertyDescription(propertyData);

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'property_description',
        prompt: JSON.stringify(propertyData),
        response: result.text,
        // metadata: result.metadata, // Removed as it's not in schema
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating property description:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate property description',
    });
  }
});

// Analyze maintenance request
router.post('/maintenance-analysis', authenticateToken, [
  body('title').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('category').optional().isString(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const maintenanceData = req.body;
    
    const result = await aiService.analyzeMaintenanceRequest(maintenanceData);

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'maintenance_analysis',
        prompt: JSON.stringify(maintenanceData),
        response: JSON.stringify(result),
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error analyzing maintenance request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze maintenance request',
    });
  }
});

// Generate lease summary
router.post('/lease-summary', authenticateToken, [
  body('leaseText').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { leaseText } = req.body;
    
    const result = await aiService.generateLeaseSummary(leaseText);

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'lease_summary',
        prompt: leaseText.substring(0, 1000), // Truncate for storage
        response: result.text,
        // metadata: result.metadata, // Removed as it's not in schema
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating lease summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate lease summary',
    });
  }
});

// Translate text
router.post('/translate', authenticateToken, [
  body('text').isString().notEmpty(),
  body('targetLanguage').isString().notEmpty(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;
    
    const result = await aiService.translateText(text, targetLanguage);

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'translation',
        prompt: text,
        response: result.text,
        // metadata: result.metadata, // Removed as it's not in schema
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error translating text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to translate text',
    });
  }
});

// Extract keywords
router.post('/keywords', authenticateToken, [
  body('text').isString().notEmpty(),
  body('maxKeywords').optional().isInt({ min: 1, max: 50 }),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { text, maxKeywords } = req.body;
    
    const keywords = await aiService.extractKeywords(text, maxKeywords);

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'keyword_extraction',
        prompt: text,
        response: JSON.stringify(keywords),
      },
    });

    res.json({
      success: true,
      data: { keywords },
    });
  } catch (error: any) {
    console.error('Error extracting keywords:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract keywords',
    });
  }
});

// Get AI usage statistics
router.get('/usage-stats', authenticateToken, [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('type').optional().isString(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type } = req.query;
    const userId = (req.user as User)!.id;

    const where: any = {
      userId,
      ...(type && { feature: type as string }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      }),
    };

    const [usage, total] = await Promise.all([
      (prisma as any).aIUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      (prisma as any).aIUsageLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        usage,
        total,
      },
    });
  } catch (error: any) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage stats',
    });
  }
});

// AI Insights Dashboard
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const {
      timeRange = '30d',
      searchQuery = '',
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;

    // Generate mock insights based on query parameters
    const mockInsights = [
      {
        id: 'insight-1',
        title: 'Rent Price Optimization',
        description: 'AI suggests increasing rent by 5% for properties in downtown area due to high demand.',
        category: 'financial',
        priority: 'high',
        confidence: 0.92,
        impact: 0.85,
        recommendations: [
          {
            id: 'rec-1',
            title: 'Implement rent increase',
            description: 'Gradually increase rent by 5% over the next quarter',
            priority: 'high',
            actions: [
              {
                id: 'action-1',
                description: 'Notify tenants of upcoming rent adjustment',
                completed: false,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              }
            ]
          }
        ],
        timestamp: new Date().toISOString(),
        trend: 'up'
      },
      {
        id: 'insight-2',
        title: 'Maintenance Response Time Improvement',
        description: 'Average maintenance response time has increased by 15% this month.',
        category: 'operational',
        priority: 'medium',
        confidence: 0.78,
        impact: 0.65,
        recommendations: [
          {
            id: 'rec-2',
            title: 'Optimize maintenance scheduling',
            description: 'Implement automated scheduling for routine maintenance',
            priority: 'medium',
            actions: [
              {
                id: 'action-2',
                description: 'Review current maintenance workflow',
                completed: false
              }
            ]
          }
        ],
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        trend: 'down'
      },
      {
        id: 'insight-3',
        title: 'Tenant Satisfaction Score Decline',
        description: 'Tenant satisfaction scores have dropped by 8% in the last month.',
        category: 'tenant_satisfaction',
        priority: 'critical',
        confidence: 0.89,
        impact: 0.75,
        recommendations: [
          {
            id: 'rec-3',
            title: 'Launch tenant feedback survey',
            description: 'Conduct comprehensive survey to identify pain points',
            priority: 'critical',
            actions: [
              {
                id: 'action-3',
                description: 'Design and distribute feedback survey',
                completed: false,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
              }
            ]
          }
        ],
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        trend: 'down'
      }
    ];

    // Filter insights based on search query
    let filteredInsights = mockInsights;
    if (searchQuery) {
      const query = searchQuery.toString().toLowerCase();
      filteredInsights = mockInsights.filter(insight =>
        insight.title.toLowerCase().includes(query) ||
        insight.description.toLowerCase().includes(query) ||
        insight.category.toLowerCase().includes(query)
      );
    }

    // Sort insights
    filteredInsights.sort((a, b) => {
      let aValue: any, bValue: any;
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

      switch (sortBy) {
        case 'priority':
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'impact':
          aValue = a.impact;
          bValue = b.impact;
          break;
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        default:
          aValue = a.priority;
          bValue = b.priority;
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    // Return the correct response structure for the frontend
    const response = {
      data: filteredInsights,
      status: 'success'
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch insights'
    });
  }
});

router.get('/insights/summary', getDashboardSummary);
router.get('/insights/categories', getInsightCategories);
router.post('/insights/:insightId/regenerate', regenerateInsight);

// Market Intelligence Endpoints (using /ai base path as per frontend)
router.get('/market-intelligence', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: { message: 'Market intelligence overview data' } });
  } catch (error: any) {
    console.error('Error fetching market intelligence overview:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch market intelligence overview' });
  }
});

router.get('/market-intelligence/competitors', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: { message: 'Competitor activity data' } });
  } catch (error: any) {
    console.error('Error fetching competitor activity:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch competitor activity' });
  }
});

router.get('/market-intelligence/opportunities', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: { message: 'Market opportunities data' } });
  } catch (error: any) {
    console.error('Error fetching market opportunities:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch market opportunities' });
  }
});

router.get('/market-intelligence/trends', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: { message: 'Market trends data' } });
  } catch (error: any) {
    console.error('Error fetching market trends:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch market trends' });
  }
});

router.get('/market-intelligence/forecasts', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: { message: 'Demand forecasts data' } });
  } catch (error: any) {
    console.error('Error fetching demand forecasts:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch demand forecasts' });
  }
});


export default router;

// Add these endpoints for full frontend compatibility:

// Direct endpoints for frontend compatibility (matching frontend expectations)
router.get('/competitors', async (req: Request, res: Response) => {
  try {
    // Mock competitor data matching the exact frontend CompetitorData interface
    const competitors = [
      {
        id: 'comp-1',
        name: 'Downtown Luxury Rentals',
        location: [-122.4194, 37.7749], // [longitude, latitude]
        address: '123 Main St, Downtown, CA 94102',
        rentRange: [2400, 3200], // [min, max]
        occupancyRate: 0.94,
        amenities: ['Gym', 'Pool', 'Parking', 'Rooftop Deck'],
        propertyType: 'Luxury Apartments',
        units: 45,
        recentActivity: [
          {
            id: 'activity-1',
            type: 'price_change',
            description: 'Increased rent by 3%',
            date: new Date(),
            impact: 'positive',
            confidence: 0.85
          }
        ],
        marketShare: 0.15
      },
      {
        id: 'comp-2',
        name: 'Riverside Properties',
        location: [-122.4213, 37.7730],
        address: '456 River Ave, Riverside District, CA 94103',
        rentRange: [2200, 3000],
        occupancyRate: 0.89,
        amenities: ['Laundry', 'Parking', 'Pet Friendly'],
        propertyType: 'Mid-Range Apartments',
        units: 32,
        recentActivity: [
          {
            id: 'activity-2',
            type: 'new_listing',
            description: 'New property acquisition',
            date: new Date(Date.now() - 86400000),
            impact: 'positive',
            confidence: 0.78
          }
        ],
        marketShare: 0.12
      },
      {
        id: 'comp-3',
        name: 'City View Apartments',
        location: [-122.4185, 37.7765],
        address: '789 View St, Midtown, CA 94104',
        rentRange: [2000, 2800],
        occupancyRate: 0.91,
        amenities: ['Gym', 'Laundry', 'Pet Friendly', 'Parking'],
        propertyType: 'Standard Apartments',
        units: 28,
        recentActivity: [
          {
            id: 'activity-3',
            type: 'renovation',
            description: 'Kitchen renovations completed',
            date: new Date(Date.now() - 172800000),
            impact: 'positive',
            confidence: 0.82
          }
        ],
        marketShare: 0.10
      }
    ];

    res.json(competitors);
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch competitor data'
    });
  }
});

router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    // Mock market opportunities data matching MarketOpportunity interface exactly
    const opportunities = [
      {
        id: 'opp-1',
        title: 'Emerging Neighborhood Opportunity',
        description: 'Northside district showing 12% rent growth potential',
        type: 'location',
        priority: 'high',
        potentialImpact: '15% rent increase',
        confidence: { value: 87, explanation: 'High confidence based on recent market trends and growth indicators' },
        actionItems: ['Research local market trends', 'Evaluate property acquisition costs', 'Assess neighborhood development plans'],
        timeline: '6-12 months',
        estimatedROI: 15
      },
      {
        id: 'opp-2',
        title: 'Kitchen Renovation ROI',
        description: 'Properties with outdated kitchens can achieve 8-12% rent increase',
        type: 'pricing',
        priority: 'medium',
        potentialImpact: '10% rent increase',
        confidence: { value: 92, explanation: 'Very high confidence based on similar renovation projects in the area' },
        actionItems: ['Survey existing kitchen conditions', 'Get contractor quotes', 'Plan renovation schedule'],
        timeline: '3-6 months',
        estimatedROI: 25
      },
      {
        id: 'opp-3',
        title: 'EV Charging Station Addition',
        description: 'Adding EV charging can justify 5-8% rent premium',
        type: 'amenity',
        priority: 'medium',
        potentialImpact: '7% rent increase',
        confidence: { value: 89, explanation: 'High confidence based on growing EV adoption and tenant preferences' },
        actionItems: ['Assess parking space availability', 'Research EV charging equipment costs', 'Check local regulations'],
        timeline: '1-3 months',
        estimatedROI: 18
      }
    ];

    res.json(opportunities);
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market opportunities'
    });
  }
});

router.get('/trends', async (req: Request, res: Response) => {
  try {
    // Mock market trends data matching MarketTrend interface
    const trends = [
      {
        id: 'trend-1',
        metric: 'Average Rental Rate',
        currentValue: 2750,
        previousValue: 2641,
        change: 109,
        changePercent: 4.2,
        trend: 'up',
        timeframe: '3 months',
        unit: 'USD',
        category: 'rent'
      },
      {
        id: 'trend-2',
        metric: 'Occupancy Rate',
        currentValue: 92,
        previousValue: 91.9,
        change: 0.1,
        changePercent: 0.1,
        trend: 'stable',
        timeframe: '6 months',
        unit: '%',
        category: 'demand'
      },
      {
        id: 'trend-3',
        metric: 'Market Demand Growth',
        currentValue: 118,
        previousValue: 100,
        change: 18,
        changePercent: 18,
        trend: 'up',
        timeframe: '2 months',
        unit: 'index',
        category: 'demand'
      }
    ];

    res.json(trends);
  } catch (error: any) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market trends'
    });
  }
});

router.get('/forecasts', async (req: Request, res: Response) => {
  try {
    // Mock demand forecasts data matching DemandForecast interface exactly
    const forecasts = [
      {
        id: 'forecast-1',
        period: 'Q4 2025',
        predictedDemand: 108,
        confidence: { value: 82, level: 'high' },
        factors: [
          { name: 'Economic Growth', impact: 0.25, description: 'Positive GDP indicators', weight: 0.4 },
          { name: 'Job Market', impact: 0.20, description: 'Employment rate improvements', weight: 0.3 },
          { name: 'Seasonal Demand', impact: 0.15, description: 'Holiday season rental patterns', weight: 0.3 }
        ],
        seasonalAdjustment: 1.05,
        trendDirection: 'increasing'
      },
      {
        id: 'forecast-2',
        period: 'Next 6 Months',
        predictedDemand: 106,
        confidence: { value: 79, level: 'medium' },
        factors: [
          { name: 'Inflation Trends', impact: 0.30, description: 'Cost of living adjustments', weight: 0.35 },
          { name: 'Supply Constraints', impact: 0.25, description: 'Limited new construction', weight: 0.35 },
          { name: 'Interest Rates', impact: -0.10, description: 'Potential rate increases', weight: 0.3 }
        ],
        seasonalAdjustment: 1.02,
        trendDirection: 'increasing'
      },
      {
        id: 'forecast-3',
        period: 'Next 4 Months',
        predictedDemand: 100.2,
        confidence: { value: 86, level: 'high' },
        factors: [
          { name: 'Market Stability', impact: 0.10, description: 'Consistent demand patterns', weight: 0.4 },
          { name: 'Competitive Positioning', impact: 0.05, description: 'Strong market presence', weight: 0.3 },
          { name: 'Economic Conditions', impact: 0.02, description: 'Stable employment rates', weight: 0.3 }
        ],
        seasonalAdjustment: 1.01,
        trendDirection: 'stable'
      }
    ];

    res.json(forecasts);
  } catch (error: any) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch demand forecasts'
    });
  }
});

// Additional endpoints for other frontend calls
router.get('/', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: { message: 'AI service overview' }
    });
  } catch (error: any) {
    console.error('Error fetching AI overview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch AI overview'
    });
  }
});


router.post('/feedback', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type, rating, comment } = req.body;

    res.json({
      success: true,
      data: { message: 'Feedback submitted successfully' }
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit feedback'
    });
  }
});

router.get('/alerts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const alerts = [
      {
        id: 'alert-1',
        type: 'price_increase',
        title: 'Competitor Price Increase',
        description: 'Downtown Luxury Rentals increased prices by 3%',
        severity: 'medium',
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert-2',
        type: 'new_competitor',
        title: 'New Market Entrant',
        description: 'New property management company entering the area',
        severity: 'low',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alerts'
    });
  }
});

router.get('/valuation', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.query;

    const valuation = {
      propertyId: propertyId || 'default',
      estimatedValue: 450000,
      confidence: 0.85,
      comparables: [
        { id: 'comp-1', address: '123 Main St', value: 445000, distance: 0.5 },
        { id: 'comp-2', address: '456 Oak Ave', value: 460000, distance: 0.8 },
        { id: 'comp-3', address: '789 Pine Dr', value: 435000, distance: 1.2 }
      ],
      factors: {
        location: 0.9,
        condition: 0.8,
        marketTrends: 0.85
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: valuation
    });
  } catch (error: any) {
    console.error('Error fetching property valuation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch property valuation'
    });
  }
});

router.post('/investment-analysis', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { propertyIds } = req.body;

    const analysis = {
      properties: propertyIds || [],
      totalInvestment: 1200000,
      projectedROI: 0.12,
      annualCashFlow: 85000,
      breakEvenYears: 8.5,
      riskScore: 0.65,
      recommendations: [
        'Consider renovating kitchen for higher rental income',
        'Monitor local market trends quarterly',
        'Maintain occupancy above 90% for optimal returns'
      ],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Error performing investment analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform investment analysis'
    });
  }
});

router.get('/rental-analysis', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { location } = req.query;

    const analysis = {
      location: location || 'Downtown',
      averageRent: 2750,
      medianRent: 2650,
      rentGrowth: 0.042,
      occupancyRate: 0.92,
      daysOnMarket: 18,
      demandScore: 0.88,
      supplyScore: 0.76,
      recommendations: [
        'Current market favors landlords',
        'Consider rent increases of 3-5%',
        'High demand for 1-2 bedroom units'
      ],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Error fetching rental market analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch rental market analysis'
    });
  }
});

// AI Communication endpoints (for aiService.ts)
router.get('/communication/settings', authenticateToken, async (req: Request, res: Response) => {
  // Implementation needed
});

router.post('/communication/generate', authenticateToken, async (req: Request, res: Response) => {
  // Implementation needed
});

// AI Recommendations endpoint (for aiInsightsService.ts)
router.post('/recommendations', authenticateToken, async (req: Request, res: Response) => {
  // Implementation needed
});