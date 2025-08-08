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
    // Mock data for now
    const insights = [
      {
        id: 'insight1',
        title: 'High Vacancy in Downtown Properties',
        description: 'Properties in the downtown area are experiencing higher than average vacancy rates over the past quarter.',
        category: 'operational',
        priority: 'critical',
        confidence: 0.95,
        impact: 0.8,
        recommendations: [
          { id: 'rec1', text: 'Adjust rental prices for downtown units.', actions: [{ id: 'act1', text: 'Review pricing strategy', completed: false }] },
          { id: 'rec2', text: 'Increase marketing efforts in downtown area.', actions: [{ id: 'act2', text: 'Launch social media campaign', completed: false }] }
        ],
        timestamp: new Date().toISOString(),
        trend: 'up',
      },
      {
        id: 'insight2',
        title: 'Tenant Satisfaction Dropping for Maintenance',
        description: 'Feedback from tenants indicates a decline in satisfaction regarding maintenance request resolution times.',
        category: 'tenant_satisfaction',
        priority: 'high',
        confidence: 0.88,
        impact: 0.7,
        recommendations: [
          { id: 'rec3', text: 'Investigate maintenance workflow bottlenecks.', actions: [{ id: 'act3', text: 'Analyze ticket resolution times', completed: false }] }
        ],
        timestamp: new Date().toISOString(),
        trend: 'down',
      },
    ];

    res.json({ status: 'success', data: { categories: [{ id: 'cat1', name: 'Operational', category: 'operational', insights: insights.filter(i => i.category === 'operational'), totalCount: insights.filter(i => i.category === 'operational').length }, { id: 'cat2', name: 'Tenant Satisfaction', category: 'tenant_satisfaction', insights: insights.filter(i => i.category === 'tenant_satisfaction'), totalCount: insights.filter(i => i.category === 'tenant_satisfaction').length }] } });
  } catch (error) {
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
