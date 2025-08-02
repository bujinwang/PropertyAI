import { Router, Request, Response } from 'express';
import { User } from '@prisma/client';
import { aiService } from '../services/ai.service';
import { authenticateToken } from '../middleware/auth';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';

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

// Generate summary
router.post('/summary', authenticateToken, [
  body('text').isString().notEmpty(),
  body('maxLength').optional().isInt({ min: 50, max: 1000 }),
  body('minLength').optional().isInt({ min: 10, max: 500 }),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { text, maxLength, minLength } = req.body;
    
    const result = await aiService.generateSummary({
      text,
      maxLength,
      minLength,
    });

    // Log the request
    await (prisma as any).aIUsageLog.create({
      data: {
        userId: (req.user as User)!.id,
        feature: 'summary_generation',
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
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate summary',
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

export default router;