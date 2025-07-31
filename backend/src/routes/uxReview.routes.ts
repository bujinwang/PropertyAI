import { Router } from 'express';
import { uxReviewService } from '../services/uxReview.service';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// UX Review CRUD operations
router.post('/', authorize(['ADMIN', 'PROPERTY_MANAGER']), async (req, res) => {
  try {
    const review = await uxReviewService.createReview({
      ...req.body,
      reviewerId: req.user.id,
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      status,
      severity,
      priority,
      reviewerId,
      componentId,
      reviewType,
      tags,
      limit,
      offset,
    } = req.query;

    const filters = {
      status: status as string,
      severity: severity as string,
      priority: priority as string,
      reviewerId: reviewerId as string,
      componentId: componentId as string,
      reviewType: reviewType as string,
      tags: tags ? (tags as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const reviews = await uxReviewService.getReviews(filters);
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await uxReviewService.getReviewStats();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authorize(['ADMIN', 'PROPERTY_MANAGER']), async (req, res) => {
  try {
    const review = await uxReviewService.updateReview(req.params.id, req.body);
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authorize(['ADMIN']), async (req, res) => {
  try {
    await uxReviewService.deleteReview(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UX Review Comments
router.post('/:id/comments', async (req, res) => {
  try {
    const comment = await uxReviewService.addComment({
      ...req.body,
      reviewId: req.params.id,
      authorId: req.user.id,
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await uxReviewService.getComments(req.params.id);
    res.json(comments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UX Review Assignments
router.post('/:id/assign', authorize(['ADMIN', 'PROPERTY_MANAGER']), async (req, res) => {
  try {
    const assignment = await uxReviewService.assignReview({
      reviewId: req.params.id,
      ...req.body,
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/assignments/:userId', async (req, res) => {
  try {
    const assignments = await uxReviewService.getAssignments(req.params.userId);
    res.json(assignments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UX Metrics
router.post('/:id/metrics', async (req, res) => {
  try {
    const metric = await uxReviewService.addMetric({
      ...req.body,
      reviewId: req.params.id,
    });
    res.status(201).json(metric);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/metrics', async (req, res) => {
  try {
    const metrics = await uxReviewService.getMetrics(req.params.id);
    res.json(metrics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UX Surveys
router.post('/surveys', authorize(['ADMIN', 'PROPERTY_MANAGER']), async (req, res) => {
  try {
    const survey = await uxReviewService.createSurvey({
      ...req.body,
      createdById: req.user.id,
    });
    res.status(201).json(survey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/surveys', async (req, res) => {
  try {
    const { status } = req.query;
    const surveys = await uxReviewService.getSurveys(status as string);
    res.json(surveys);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/surveys/:surveyId/responses', async (req, res) => {
  try {
    const response = await uxReviewService.addSurveyResponse({
      ...req.body,
      surveyId: req.params.surveyId,
      respondentId: req.user.id,
    });
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UX Analytics
router.post('/analytics', async (req, res) => {
  try {
    const analytics = await uxReviewService.recordAnalytics(req.body);
    res.status(201).json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const summary = await uxReviewService.getAnalyticsSummary(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const {
      metricName,
      category,
      source,
      startDate,
      endDate,
    } = req.query;

    const filters = {
      metricName: metricName as string,
      category: category as string,
      source: source as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const analytics = await uxReviewService.getAnalytics(filters);
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;