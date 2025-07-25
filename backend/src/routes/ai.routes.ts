import { Router } from 'express';
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
], async (req, res) => {
  try {
    const { text, context, language, maxLength } = req.body;
    
    const result = await aiService.generateText({
      text,
      context,
      language,
      maxLength,
    });

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'text_generation',
        input: text,
        output: result.text,
        metadata: result.metadata,
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
], async (req, res) => {
  try {
    const { text } = req.body;
    
    const result = await aiService.analyzeSentiment(text);

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'sentiment_analysis',
        input: text,
        output: JSON.stringify(result),
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
], async (req, res) => {
  try {
    const { text } = req.body;
    
    const result = await aiService.extractEntities(text);

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'entity_extraction',
        input: text,
        output: JSON.stringify(result),
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
], async (req, res) => {
  try {
    const { text, maxLength, minLength } = req.body;
    
    const result = await aiService.generateSummary({
      text,
      maxLength,
      minLength,
    });

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'summary_generation',
        input: text,
        output: result.text,
        metadata: result.metadata,
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
], async (req, res) => {
  try {
    const { text, labels } = req.body;
    
    const result = await aiService.classifyText({
      text,
      labels,
    });

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'text_classification',
        input: text,
        output: result.text,
        metadata: result.metadata,
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
], async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;
    
    const result = await aiService.chat({
      message,
      conversationId,
      context,
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
], async (req, res) => {
  try {
    const propertyData = req.body;
    
    const result = await aiService.generatePropertyDescription(propertyData);

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'property_description',
        input: JSON.stringify(propertyData),
        output: result.text,
        metadata: result.metadata,
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
], async (req, res) => {
  try {
    const maintenanceData = req.body;
    
    const result = await aiService.analyzeMaintenanceRequest(maintenanceData);

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'maintenance_analysis',
        input: JSON.stringify(maintenanceData),
        output: JSON.stringify(result),
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
], async (req, res) => {
  try {
    const { leaseText } = req.body;
    
    const result = await aiService.generateLeaseSummary(leaseText);

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'lease_summary',
        input: leaseText.substring(0, 1000), // Truncate for storage
        output: result.text,
        metadata: result.metadata,
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
], async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    const result = await aiService.translateText(text, targetLanguage);

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'translation',
        input: text,
        output: result.text,
        metadata: result.metadata,
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
], async (req, res) => {
  try {
    const { text, maxKeywords } = req.body;
    
    const keywords = await aiService.extractKeywords(text, maxKeywords);

    // Log the request
    await prisma.aIUsageLog.create({
      data: {
        userId: req.user!.id,
        type: 'keyword_extraction',
        input: text,
        output: JSON.stringify(keywords),
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
], async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const userId = req.user!.id;

    const where = {
      userId,
      ...(type && { type: type as string }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      }),
    };

    const [usage, total] = await Promise.all([
      prisma.aIUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.aIUsageLog.count({ where }),
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