import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { smartSearchService } from '../nlp/smartSearch';
import { prisma } from '../config/database';

const router = Router();

// Smart search endpoint
router.post('/search', authenticateToken, [
  body('query').isString().notEmpty().isLength({ min: 2, max: 200 }),
  body('filters').optional().isObject(),
  body('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { query, filters, limit = 20 } = req.body;

    const results = await smartSearchService.smartSearch({
      query,
      filters,
      limit,
    });

    // Log the search
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: 'smart_search',
        prompt: query,
        response: JSON.stringify(results),
      },
    });

    res.json({
      success: true,
      data: {
        query,
        results,
        totalResults: results.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in smart search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform smart search',
    });
  }
});

// Search suggestions endpoint
router.get('/suggestions', authenticateToken, [
  query('query').isString().isLength({ min: 1, max: 100 }),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    const suggestions = await smartSearchService.getSearchSuggestions(query as string);

    res.json({
      success: true,
      data: {
        query,
        suggestions,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get search suggestions',
    });
  }
});

// Advanced search with filters
router.post('/advanced-search', authenticateToken, [
  body('query').isString().notEmpty(),
  body('filters').optional().isObject(),
  body('sortBy').optional().isIn(['relevance', 'date', 'type']),
  body('sortOrder').optional().isIn(['asc', 'desc']),
  body('page').optional().isInt({ min: 1 }),
  body('pageSize').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { query, filters, sortBy = 'relevance', sortOrder = 'desc', page = 1, pageSize = 20 } = req.body;

    let results = await smartSearchService.smartSearch({
      query,
      filters,
      limit: 1000, // Get more results for pagination
    });

    // Apply sorting
    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore;
          break;
        case 'date':
          // For date sorting, we'd need to extract dates from metadata
          comparison = 0; // Placeholder
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = b.relevanceScore - a.relevanceScore;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Log the advanced search
    await prisma.aIUsageLog.create({
      data: {
        userId: (req as any).user!.id,
        feature: 'advanced_search',
        prompt: JSON.stringify({ query, filters, sortBy, sortOrder }),
        response: JSON.stringify(paginatedResults),
      },
    });

    res.json({
      success: true,
      data: {
        query,
        results: paginatedResults,
        pagination: {
          page,
          pageSize,
          totalResults: results.length,
          totalPages: Math.ceil(results.length / pageSize),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in advanced search:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform advanced search',
    });
  }
});

// Search analytics endpoint
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const analytics = await smartSearchService.getSearchAnalytics();

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('Error getting search analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get search analytics',
    });
  }
});

// Quick search shortcuts
router.get('/shortcuts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const shortcuts = [
      {
        id: 'recent_maintenance',
        title: 'Recent Maintenance',
        query: 'maintenance request last 30 days',
        description: 'Find maintenance requests from the last 30 days',
        icon: '🔧',
      },
      {
        id: 'overdue_payments',
        title: 'Overdue Payments',
        query: 'overdue rent payments',
        description: 'Find tenants with overdue rent payments',
        icon: '💰',
      },
      {
        id: 'vacant_units',
        title: 'Vacant Units',
        query: 'vacant units available',
        description: 'Find available vacant units',
        icon: '🏠',
      },
      {
        id: 'tenant_issues',
        title: 'Tenant Issues',
        query: 'tenant complaints urgent',
        description: 'Find urgent tenant complaints and issues',
        icon: '👥',
      },
      {
        id: 'financial_summary',
        title: 'Financial Summary',
        query: 'monthly financial summary',
        description: 'Get monthly financial overview',
        icon: '📊',
      },
    ];

    res.json({
      success: true,
      data: shortcuts,
    });
  } catch (error: any) {
    console.error('Error getting search shortcuts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get search shortcuts',
    });
  }
});

// Save search query for user
router.post('/save-query', authenticateToken, [
  body('name').isString().notEmpty(),
  body('query').isString().notEmpty(),
  body('filters').optional().isObject(),
  validateRequest,
], async (req: Request, res: Response) => {
  try {
    const { name, query, filters } = req.body;
    const userId = (req as any).user!.id;

    // Save to user's saved searches (assuming we have a SavedSearch model)
    // For now, we'll just return success
    await prisma.aIUsageLog.create({
      data: {
        userId,
        feature: 'saved_search',
        prompt: `Saved search: ${name}`,
        response: JSON.stringify({ name, query, filters }),
      },
    });

    res.json({
      success: true,
      message: 'Search query saved successfully',
      data: {
        name,
        query,
        filters,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error saving search query:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save search query',
    });
  }
});

// Get user's saved searches
router.get('/saved-searches', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;

    // For now, return mock saved searches
    const savedSearches = [
      {
        id: '1',
        name: 'Monthly Maintenance',
        query: 'maintenance requests this month',
        filters: { dateRange: { start: '2024-01-01', end: '2024-01-31' } },
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Overdue Payments',
        query: 'overdue payments',
        filters: {},
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: savedSearches,
    });
  } catch (error: any) {
    console.error('Error getting saved searches:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get saved searches',
    });
  }
});

export default router;