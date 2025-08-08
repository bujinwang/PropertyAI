import { Router } from 'express';
import { uxReviewService } from '../services/uxReview.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// UX Review CRUD operations
router.post('/', async (req, res) => {
  try {
    const review = await uxReviewService.createReview({
      ...req.body,
      reviewerId: (req as any).user.id,
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      reviewerId,
      componentType,
      limit,
      offset,
    } = req.query;

    const filters = {
      status: status as string,
      priority: priority as string,
      reviewerId: reviewerId as string,
      componentType: componentType as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const reviews = await uxReviewService.getReviews(filters);
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [byStatus, byPriority, byComponentType, totalCount, last7Days] = await Promise.all([
      (async () => {
        const prisma = new (await import('@prisma/client')).PrismaClient();
        return prisma.uXReview.groupBy({
          by: ['status'],
          _count: { _all: true },
        });
      })(),
      (async () => {
        const prisma = new (await import('@prisma/client')).PrismaClient();
        const all = await prisma.uXReview.findMany({ select: { priority: true } });
        const map: Record<string, number> = {};
        for (const r of all) map[r.priority] = (map[r.priority] || 0) + 1;
        return Object.entries(map).map(([priority, count]) => ({ priority, _count: { _all: count } }));
      })(),
      (async () => {
        const prisma = new (await import('@prisma/client')).PrismaClient();
        const all = await prisma.uXReview.findMany({ select: { componentType: true } });
        const map: Record<string, number> = {};
        for (const r of all) map[r.componentType] = (map[r.componentType] || 0) + 1;
        return Object.entries(map).map(([componentType, count]) => ({ componentType, _count: { _all: count } }));
      })(),
      (async () => {
        const prisma = new (await import('@prisma/client')).PrismaClient();
        return prisma.uXReview.count();
      })(),
      (async () => {
        const prisma = new (await import('@prisma/client')).PrismaClient();
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return prisma.uXReview.count({ where: { createdAt: { gte: since } } });
      })(),
    ]);

    const formatCounts = (arr: any[], key: string) =>
      arr.reduce((acc: Record<string, number>, item: any) => {
        const k = item[key];
        acc[k] = (item._count?._all as number) || 0;
        return acc;
      }, {});

    res.json({
      total: totalCount,
      last7Days,
      countsByStatus: formatCounts(byStatus as any[], 'status'),
      countsByPriority: formatCounts(byPriority as any[], 'priority'),
      countsByComponentType: formatCounts(byComponentType as any[], 'componentType'),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const review = await uxReviewService.getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const review = await uxReviewService.updateReview(req.params.id, req.body);
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await uxReviewService.deleteReview(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// UX Review Comments
router.post('/:id/comments', async (req, res) => {
  try {
    const comment = await uxReviewService.createComment({
      ...req.body,
      reviewId: req.params.id,
      authorId: (req as any).user.id,
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// UX Review Assignments
router.post('/:id/assign', async (req, res) => {
  try {
    const assignment = await uxReviewService.assignReview({
      reviewId: req.params.id,
      ...req.body,
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// UX Surveys
router.post('/surveys', async (req, res) => {
  try {
    const survey = await uxReviewService.createSurvey({
      ...req.body,
      createdById: (req as any).user.id,
    });
    res.status(201).json(survey);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/surveys', async (req, res) => {
  try {
    const { status } = req.query;
    const surveys = await uxReviewService.getSurveys({ status: status as string });
    res.json(surveys);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/surveys/:surveyId/responses', async (req, res) => {
  try {
    const response = await uxReviewService.createSurveyResponse({
      ...req.body,
      surveyId: req.params.surveyId,
      respondentId: (req as any).user.id,
    });
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;