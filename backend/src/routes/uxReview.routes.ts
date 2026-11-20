import { Router, Request, Response } from 'express';
import { User, UserRole } from '@prisma/client';
import { uxReviewService } from '../services/uxReview.service';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../config/database';

/**
 * UX review workflow.
 *
 * WHAT WAS WRONG
 * --------------
 * `router.use(authenticateToken)` only. Create stamped `reviewerId` from the
 * token (correct), but nothing else consulted the caller:
 *   - `PUT /:id` and `DELETE /:id` let ANY authenticated user rewrite or delete
 *     ANY review, including confidential UX findings.
 *   - `POST /:id/assign` let anyone assign anyone to any review.
 *   - `GET /` returned every review regardless of reviewer.
 *
 * Ownership here is `UXReview.reviewerId` — a direct column, so this is a plain
 * "is this row's reviewerId me?" check, not a Rental-graph question. ADMIN may
 * act on any review (moderation); PROPERTY_MANAGER may see the queue because
 * triaging UX findings is part of that role.
 *
 * SECOND BUG: A PRISMA CLIENT PER REQUEST
 * ---------------------------------------
 * `GET /stats` used to build FIVE separate `new PrismaClient()` instances inside
 * the request — one per `Promise.all` branch, each via a dynamic
 * `await import('@prisma/client')`. Every client opens its own connection pool
 * and none was ever `$disconnect()`ed, so each stats call leaked five pools until
 * Postgres refused new connections. It also kept Jest from exiting. All five are
 * replaced by the shared `prisma` singleton.
 */

const router = Router();

router.use(authenticateToken);

const callerId = (req: Request): string | undefined => (req.user as User | undefined)?.id;
const callerRole = (req: Request): UserRole | undefined =>
  (req.user as User | undefined)?.role;

const isAdmin = (req: Request): boolean => callerRole(req) === UserRole.ADMIN;

/** Roles that may see the whole review queue. */
const QUEUE_ROLES: readonly (UserRole | undefined)[] = [
  UserRole.ADMIN,
  UserRole.PROPERTY_MANAGER,
];

/**
 * Load a review and decide whether the caller may MUTATE it.
 * 404 before 403, so a legitimate reviewer who mistypes an id learns the truth.
 */
async function authorizeReview(
  req: Request,
  res: Response
): Promise<{ id: string; reviewerId: string } | null> {
  const { id } = req.params;

  const review = await prisma.uXReview.findUnique({
    where: { id },
    select: { id: true, reviewerId: true },
  });

  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return null;
  }

  const me = callerId(req);
  if (!me) {
    res.status(401).json({ error: 'User not authenticated' });
    return null;
  }

  if (review.reviewerId !== me && !isAdmin(req)) {
    res.status(403).json({ error: 'You do not have access to this review' });
    return null;
  }

  return review;
}

// ---------------------------------------------------------------- create ---
router.post('/', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, description, componentType, priority } = req.body ?? {};
    if (!title || !componentType) {
      return res.status(400).json({ error: 'title and componentType are required' });
    }

    const review = await uxReviewService.createReview({
      title,
      description,
      componentType,
      priority,
      // Stamped from the token. A body-supplied `reviewerId` is ignored: it would
      // let a caller file findings under someone else's name.
      reviewerId: me,
    } as any);

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ------------------------------------------------------------------ list ---
router.get('/', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status, priority, reviewerId, componentType, limit, offset } = req.query;

    // Operators get the queue; everyone else is scoped to their own reviews.
    // A caller-supplied `reviewerId` may NARROW an operator's view but can never
    // widen a non-operator's.
    const operator = QUEUE_ROLES.includes(callerRole(req));
    const effectiveReviewerId = operator ? (reviewerId as string | undefined) : me;

    const reviews = await uxReviewService.getReviews({
      status: status as string,
      priority: priority as string,
      reviewerId: effectiveReviewerId,
      componentType: componentType as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ----------------------------------------------------------------- stats ---
// Declared BEFORE `/:id` so the literal segment is not captured as an id.
router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (!QUEUE_ROLES.includes(callerRole(req))) {
      return res.status(403).json({ error: 'You do not have access to review statistics' });
    }

    // One shared client. Five per-request `new PrismaClient()` instances used to
    // leak five connection pools on every call.
    const [byStatus, allPriorities, allComponents, totalCount, last7Days] = await Promise.all([
      prisma.uXReview.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.uXReview.findMany({ select: { priority: true } }),
      prisma.uXReview.findMany({ select: { componentType: true } }),
      prisma.uXReview.count(),
      prisma.uXReview.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const tally = (rows: Record<string, any>[], key: string) =>
      rows.reduce<Record<string, number>>((acc, row) => {
        const k = row[key] as string;
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});

    res.json({
      total: totalCount,
      last7Days,
      countsByStatus: (byStatus as any[]).reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count?._all || 0;
        return acc;
      }, {}),
      countsByPriority: tally(allPriorities as any[], 'priority'),
      countsByComponentType: tally(allComponents as any[], 'componentType'),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// -------------------------------------------------------------- surveys ----
// Every literal `/surveys*` route must precede `/:id`, or `/:id` swallows them.
router.post('/surveys', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, questions, description } = req.body ?? {};
    if (!title || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'title and questions are required' });
    }

    const survey = await uxReviewService.createSurvey({
      title,
      description,
      questions,
      // Stamped from the token, same reason as reviewerId above.
      createdById: me,
    } as any);

    res.status(201).json(survey);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/surveys', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status } = req.query;
    const surveys = await uxReviewService.getSurveys({ status: status as string });

    res.json(surveys);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/surveys/:surveyId/responses', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { responses, satisfactionScore } = req.body ?? {};

    const response = await uxReviewService.createSurveyResponse({
      surveyId: req.params.surveyId,
      responses,
      satisfactionScore,
      // Stamped from the token: a survey response must be attributable to its
      // real respondent, otherwise satisfaction data is forgeable.
      respondentId: me,
    } as any);

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ------------------------------------------------------------ read by id ---
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const review = await uxReviewService.getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewerId !== me && !QUEUE_ROLES.includes(callerRole(req))) {
      return res.status(403).json({ error: 'You do not have access to this review' });
    }

    res.json(review);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ---------------------------------------------------------------- update ---
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeReview(req, res);
    if (!authorized) return;

    const { title, description, status, priority, componentType } = req.body ?? {};

    // Whitelist. `reviewerId` absent: a review must not be reattributed.
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (componentType !== undefined) updateData.componentType = componentType;

    const review = await uxReviewService.updateReview(authorized.id, updateData as any);
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ---------------------------------------------------------------- delete ---
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeReview(req, res);
    if (!authorized) return;

    await uxReviewService.deleteReview(authorized.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// --------------------------------------------------------------- comment ---
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Reading a review is required to comment on it. Operators may comment on
    // anything; a reviewer only on their own.
    const review = await prisma.uXReview.findUnique({
      where: { id: req.params.id },
      select: { reviewerId: true },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewerId !== me && !QUEUE_ROLES.includes(callerRole(req))) {
      return res.status(403).json({ error: 'You do not have access to this review' });
    }

    const { content, body: bodyText } = req.body ?? {};

    const comment = await uxReviewService.createComment({
      content: content ?? bodyText,
      // Stamped from the token: `authorId` from the body would let a caller put
      // words in another user's mouth.
      reviewId: req.params.id,
      authorId: me,
    } as any);

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ---------------------------------------------------------------- assign ---
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeReview(req, res);
    if (!authorized) return;

    const { assignedToId, userId } = req.body ?? {};
    const assignee = assignedToId ?? userId;

    if (!assignee) {
      return res.status(400).json({ error: 'assignedToId is required' });
    }

    const assignment = await uxReviewService.assignReview({
      reviewId: authorized.id,
      assignedToId: assignee,
    } as any);

    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
