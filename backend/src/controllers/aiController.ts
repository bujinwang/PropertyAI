import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/dbManager';
import { AppError } from '../middleware/errorMiddleware';
import * as aiService from '../services/aiService';

export const generateDescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { propertyId } = req.params;
    const { details } = req.body;

    console.log(`[DEBUG] Received propertyId: ${propertyId}`);

    const property = await prisma.rental.findUnique({
      where: { id: propertyId },
      include: { RentalImages: true }, // Include related data if needed by AI service
    });

    console.log(`[DEBUG] Property found by Prisma:`, property);

    if (!property) {
      return next(new AppError('Property not found', 404)); // Changed error message
    }

    // The aiService.generatePropertyDescription currently expects photos and details.
    // We need to adapt this to use property data.
    // For now, let's assume it can take property details directly or we extract them.
    // This might require further changes in aiService.ts depending on its implementation.
    // Construct details object for AI service from property data
    const propertyDetailsForAI = {
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      amenities: property.amenities ? JSON.parse(property.amenities as string) : [],
      // Add other relevant property fields here
      title: property.title,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      country: property.country,
      yearBuilt: property.yearBuilt,
      // Merge with any additional details from req.body if necessary
      ...details
    };

    // The photos from req.body are likely image URLs or similar,
    // but the backend aiService.generatePropertyDescription expects string[] (image URLs).
    // We'll use the images from the property object for now.
    const imageUrls = property.RentalImages.map((img: any) => img.url);

    const description = await aiService.generatePropertyDescription(imageUrls, propertyDetailsForAI);
    
    await prisma.rental.update({ // Update Rental description, not Listing
        where: { id: propertyId },
        data: { 
          description: description
        },
    });

    console.log(`[DEBUG] Sending response for propertyId: ${propertyId}`);
    res.json({ description });
  } catch (error) {
    console.error(`[ERROR] Error in generateDescription controller for propertyId ${req.params.propertyId}:`, error);
    next(error);
  }
};

export const assessRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicantData } = req.body;
    const assessment = await aiService.assessApplicantRisk(applicantData);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

export const followUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversation } = req.body;
    const response = await aiService.generateFollowUp(conversation);
    res.json({ response });
  } catch (error) {
    next(error);
  }
};

export const sentiment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    const sentiment = await aiService.analyzeSentiment(text);
    res.json(sentiment);
  } catch (error) {
    next(error);
  }
};

export const translate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, targetLanguage } = req.body;
    const translatedText = await aiService.translateText(text, targetLanguage);
    res.json({ translatedText });
  } catch (error) {
    next(error);
  }
};

export const smartResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const response = await aiService.generateSmartResponse(message);
    res.json({ response });
  } catch (error) {
    next(error);
  }
};

export const generatePrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params; // Changed from listingId to rentalId
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { RentalImages: true }, // Include rental images instead of property/unit
    });

    if (!rental) {
      return next(new AppError('Rental not found', 404));
    }

    const price = await aiService.generatePriceRecommendation(rental);
    res.json(price);
  } catch (error) {
    next(error);
  }
};

export const analyzeImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return next(new AppError('Image URL is required', 400));
    }

    const analysis = await aiService.generateImageAnalysis(imageUrl);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
};

// Placeholder for AI Insights Dashboard
export const getInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timeRange, searchQuery, sortBy, sortOrder } = req.query;

    // Mock data for now, incorporating query parameters
    let insights = [
      {
        id: 'insight1',
        title: 'High Vacancy in Downtown Properties',
        description: 'Properties in the downtown area are experiencing higher than average vacancy rates over the past quarter.',
        category: 'operational',
        priority: 'critical',
        confidence: 95,
        impact: 0.8,
        recommendations: [
          { id: 'rec1', text: 'Adjust rental prices for downtown units.', actions: [{ id: 'act1', text: 'Review pricing strategy', completed: false }] },
          { id: 'rec2', text: 'Increase marketing efforts in downtown area.', actions: [{ id: 'act2', text: 'Launch social media campaign', completed: false }] }
        ],
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        trend: 'up',
      },
      {
        id: 'insight2',
        title: 'Tenant Satisfaction Dropping for Maintenance',
        description: 'Feedback from tenants indicates a decline in satisfaction regarding maintenance request resolution times.',
        category: 'tenant_satisfaction',
        priority: 'high',
        confidence: 88,
        impact: 0.7,
        recommendations: [
          { id: 'rec3', text: 'Investigate maintenance workflow bottlenecks.', actions: [{ id: 'act3', text: 'Analyze ticket resolution times', completed: false }] }
        ],
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        trend: 'down',
      },
      {
        id: 'insight3',
        title: 'Energy Consumption Spike in Unit 4B',
        description: 'Automated sensors detected an unusual spike in energy consumption in Unit 4B over the last week.',
        category: 'operational',
        priority: 'medium',
        confidence: 90,
        impact: 0.6,
        recommendations: [
          { id: 'rec4', text: 'Inspect Unit 4B for potential appliance malfunctions.', actions: [{ id: 'act4', text: 'Schedule inspection', completed: false }] }
        ],
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        trend: 'up',
      },
      {
        id: 'insight4',
        title: 'Positive Feedback on New Online Payment System',
        description: 'Tenants are providing overwhelmingly positive feedback on the recently implemented online payment system.',
        category: 'tenant_satisfaction',
        priority: 'low',
        confidence: 98,
        impact: 0.3,
        recommendations: [
          { id: 'rec5', text: 'Promote the online payment system more widely.', actions: [{ id: 'act5', text: 'Update tenant communication', completed: false }] }
        ],
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        trend: 'up',
      },
    ];

    // Filter by timeRange
    if (timeRange) {
      let days = 0;
      if (timeRange === '7d') days = 7;
      else if (timeRange === '30d') days = 30;
      else if (timeRange === '90d') days = 90;
      else if (timeRange === '1y') days = 365;

      if (days > 0) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        insights = insights.filter(insight => new Date(insight.timestamp) >= cutoffDate);
      }
    }

    // Filter by searchQuery
    if (searchQuery && typeof searchQuery === 'string') {
      const query = searchQuery.toLowerCase();
      insights = insights.filter(insight =>
        insight.title.toLowerCase().includes(query) ||
        insight.description.toLowerCase().includes(query) ||
        insight.category.toLowerCase().includes(query)
      );
    }

    // Sort insights
    if (sortBy) {
      insights.sort((a: any, b: any) => {
        let valA = a[sortBy as keyof typeof a];
        let valB = b[sortBy as keyof typeof b];

        // Handle string comparison for title, description, category
        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
          if (sortOrder === 'asc') {
            return valA.localeCompare(valB);
          } else {
            return valB.localeCompare(valA);
          }
        }
        // Handle numeric comparison for confidence, impact
        else if (typeof valA === 'number' && typeof valB === 'number') {
          if (sortOrder === 'asc') {
            return valA - valB;
          } else {
            return valB - valA;
          }
        }
        // Handle date comparison for timestamp
        else if (sortBy === 'timestamp') {
          const dateA = new Date(valA).getTime();
          const dateB = new Date(valB).getTime();
          if (sortOrder === 'asc') {
            return dateA - dateB;
          } else {
            return dateB - dateA;
          }
        }
        return 0;
      });
    }

    res.json({ status: 'success', data: insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    next(error);
  }
};

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock data for now
    const summary = {
      totalInsights: 15,
      highPriorityCount: 5,
      avgConfidence: 92.5,
      categoryCounts: { operational: 8, financial: 4, tenant_satisfaction: 3 },
      lastUpdated: new Date().toISOString(),
    };
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
};

export const getInsightCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock data for now
    const categories = [
      { id: 'cat1', name: 'Operational', category: 'operational', totalCount: 8 },
      { id: 'cat2', name: 'Financial', category: 'financial', totalCount: 4 },
      { id: 'cat3', name: 'Tenant Satisfaction', category: 'tenant_satisfaction', totalCount: 3 },
    ];
    res.json({ status: 'success', data: categories });
  } catch (error) {
    next(error);
  }
};


export const regenerateInsight = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { insightId } = req.params;
    
    // Mock regeneration for now - in a real implementation, this would:
    // 1. Fetch the original insight data
    // 2. Re-run the AI analysis with updated data
    // 3. Return the updated insight
    
    // For now, return a mock updated insight
    const regeneratedInsight = {
      id: insightId,
      title: 'High Vacancy in Downtown Properties (Updated)',
      description: 'Updated analysis shows properties in the downtown area are experiencing higher than average vacancy rates. Recent data indicates a slight improvement.',
      category: 'operational',
      priority: 'critical',
      confidence: 97, // Slightly higher confidence after regeneration
      impact: 0.8,
      recommendations: [
        { id: 'rec1', text: 'Adjust rental prices for downtown units.', actions: [{ id: 'act1', text: 'Review pricing strategy', completed: false }] },
        { id: 'rec2', text: 'Increase marketing efforts in downtown area.', actions: [{ id: 'act2', text: 'Launch social media campaign', completed: false }] },
        { id: 'rec3', text: 'Consider offering move-in incentives.', actions: [{ id: 'act3', text: 'Design incentive program', completed: false }] }
      ],
      timestamp: new Date().toISOString(),
      trend: 'up',
      updatedAt: new Date().toISOString(),
    };

    res.json({ 
      status: 'success', 
      data: regeneratedInsight,
      message: 'Insight regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating insight:', error);
    next(error);
  }
};
