import express, { Request, Response } from 'express';
import { AiContent as AIGeneratedContent } from '../models/mongoModels';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware as authMiddlewareModule } from '../middleware/authMiddleware';
import { generativeAIService } from '../services/generativeAI.service';
import { isOperator } from '../utils/rentalAccess';
import { rateLimiter } from '../middleware/rateLimitMiddleware';

const { protect: authMiddleware, admin: adminMiddleware } = authMiddlewareModule;

/**
 * `/api/ai-content` — AI-generated content authoring.
 *
 * THREAT MODEL / WHY THIS FILE WAS REWRITTEN
 * ------------------------------------------
 * Originally every handler here read `req.user` ZERO times. The router is
 * mounted through the barrel behind `app.use('/api', requireAuth)`, so an
 * anonymous probe got a 401 and the surface *looked* protected, while any
 * authenticated account — including a TENANT — could:
 *
 *   1. call `POST /generate`, which invokes Gemini (billed per token) with an
 *      unbounded `prompt` from the request body;
 *   2. attribute that content to anyone, because `createdBy` came from
 *      `req.body.userId` — and `userId` was a REQUIRED body field, so naming
 *      another user was the only way to call the endpoint at all;
 *   3. inject Mongo query operators through `GET /?status[$ne]=…`, because
 *      Express's extended query parser turns `a[$ne]=b` into `{$ne:'b'}` and
 *      the value was assigned straight into the Mongoose filter;
 *   4. write arbitrary fields through `PUT /:id`, which did `$set: req.body` —
 *      including `status`, `createdBy`, `contentId` and `usageMetrics`.
 *
 * POLICY (a GLOBAL row is gated on the ROUTER, not per row)
 * --------------------------------------------------------
 * `AiContent` has no tenancy path: `createdBy` is a bare string and there is no
 * `Rental` foreign key, so there is no "is this YOUR row" question to ask. That
 * makes this a pure role decision, answered by `isOperator` from the single
 * policy module (`utils/rentalAccess`) rather than a second, drifting copy.
 *
 *   reads        -> any authenticated user, but DRAFTS ARE OPERATOR-ONLY
 *   generate     -> operator only (it spends money)
 *   update       -> operator only
 *   publish      -> operator only
 *   delete       -> ADMIN only
 *   feedback     -> any authenticated user, recorded against the caller
 *
 * A draft is unpublished working copy, so hiding it from non-operators is a
 * deliberate product decision, not an artifact of the filter rewrite.
 *
 * STILL OPEN (recorded, not fixed here)
 * ------------------------------------
 * `AiContent` has no frontend consumer in `dashboard/`, `propertyapp/` or
 * `ContractorApp/` — the only matches are CSS ids in a design-system component.
 * This surface is therefore unexercised in production, and the schema
 * (`relatedEntityId`/`relatedEntityType` as untyped strings) has no referential
 * integrity: a row can name any id as its parent without that parent existing.
 */

const router = express.Router();

/** Longest prompt accepted. Gemini bills per token; the ceiling is a cost cap. */
const MAX_PROMPT_LENGTH = 20_000;

/** Upper bound on any free-text body field that is persisted verbatim. */
const MAX_TEXT_LENGTH = 20_000;

/**
 * Validate a scalar query filter.
 *
 * Express's default query parser is `extended` (the `qs` library), so
 * `?status[$ne]=draft` arrives as the OBJECT `{ $ne: 'draft' }`. Passing that
 * to Mongoose is operator injection: `$ne`, `$gt`, `$in` and friends become
 * live query semantics and the filter stops filtering.
 *
 * A repeated key (`?status=a&status=b`) arrives as an array. Rejecting it keeps
 * the contract honest: a scalar filter has exactly one value or none.
 */
function requireStringFilter(
  value: unknown,
  field: string,
  res: Response
): { ok: true; value?: string } | { ok: false } {
  if (value === undefined) return { ok: true, value: undefined };
  if (typeof value !== 'string') {
    res.status(400).json({ status: 'error', message: `${field} must be a single string value` });
    return { ok: false };
  }
  return { ok: true, value };
}

/** The authenticated caller, as hydrated by `requireAuth` / `protect`. */
function caller(req: Request): { id: string; role?: string } | undefined {
  const user = req.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return undefined;
  return { id: user.id, role: user.role };
}

/**
 * @route   GET /api/ai-content
 * @desc    Get all AI-generated content with optional filtering
 * @access  Private (drafts are operator-only)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const actor = caller(req);
    if (!actor) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated.' });
    }

    const filter: Record<string, unknown> = {};

    for (const field of ['contentType', 'relatedEntityId', 'relatedEntityType', 'status'] as const) {
      const parsed = requireStringFilter(req.query[field], field, res);
      if (!parsed.ok) return;
      if (parsed.value !== undefined) filter[field] = parsed.value;
    }

    // `tags` is the one array-valued filter: a repeated key is legitimate here
    // (`?tags=a&tags=b`), so accept string | string[] but reject objects.
    const rawTags = req.query.tags;
    if (rawTags !== undefined) {
      if (typeof rawTags === 'string') {
        filter.tags = { $in: [rawTags] };
      } else if (Array.isArray(rawTags) && rawTags.every((t) => typeof t === 'string')) {
        filter.tags = { $in: rawTags };
      } else {
        return res
          .status(400)
          .json({ status: 'error', message: 'tags must be a string or an array of strings' });
      }
    }

    // Drafts are unpublished working copy. A non-operator may not read them,
    // and may not ASK for them either — the narrowing is applied after the
    // caller's own filter so `?status=draft` cannot widen it back open.
    if (!isOperator(req)) {
      if (filter.status !== undefined && filter.status !== 'published') {
        // Asked for a status they cannot see: an empty set, not an error, so
        // the response does not confirm whether such rows exist.
        return res.json({ status: 'success', count: 0, data: [] });
      }
      filter.status = 'published';
    }

    const aiContents = await AIGeneratedContent.find(filter).sort({ createdAt: -1 });

    res.json({
      status: 'success',
      count: aiContents.length,
      data: aiContents,
    });
  } catch (error) {
    console.error('Error fetching AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching AI content',
    });
  }
});

/**
 * @route   GET /api/ai-content/:id
 * @desc    Get a single AI content by ID
 * @access  Private (drafts are operator-only)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const actor = caller(req);
    if (!actor) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated.' });
    }

    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });

    // A draft is indistinguishable from a missing row to a non-operator: 404
    // for both, so the response cannot be used to probe for unpublished ids.
    if (!aiContent || (aiContent.status !== 'published' && !isOperator(req))) {
      return res.status(404).json({ status: 'error', message: 'AI content not found' });
    }

    if (aiContent.usageMetrics) {
      aiContent.usageMetrics.views += 1;
      await aiContent.save();
    }

    res.json({ status: 'success', data: aiContent });
  } catch (error) {
    console.error('Error fetching AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching AI content',
    });
  }
});

/**
 * @route   POST /api/ai-content/generate
 * @desc    Generate new AI content
 * @access  Private (operator only — this call is billed)
 */
router.post('/generate', rateLimiter, async (req: Request, res: Response) => {
  try {
    const actor = caller(req);
    if (!actor) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated.' });
    }

    // The role gate runs BEFORE any validation and BEFORE the model call.
    // Order matters for cost, not just for status: a gate placed after
    // `generateText` would still return 403 while still charging for the
    // prompt, and a gate placed after validation would let a non-operator
    // learn the validation contract.
    if (!isOperator(req)) {
      return res
        .status(403)
        .json({ status: 'error', message: 'You do not have permission to generate content.' });
    }

    const {
      contentType,
      prompt,
      relatedEntityId,
      relatedEntityType,
      modelName,
      modelVersion,
      parameters,
      tags,
    } = req.body ?? {};

    // `userId` is deliberately NOT read: the token is the only trustworthy
    // source of identity. Requiring it in the body is what made naming another
    // user the normal path rather than the abuse case.
    if (!contentType || !prompt || !modelName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide contentType, prompt and modelName',
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({ status: 'error', message: 'prompt must be a string' });
    }

    // Cost ceiling: the prompt goes to a per-token billed API.
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        status: 'error',
        message: `prompt exceeds the maximum length of ${MAX_PROMPT_LENGTH} characters`,
      });
    }

    const generatedContent = await generativeAIService.generateText(prompt);

    const newAIContent = new AIGeneratedContent({
      contentId: uuidv4(),
      contentType,
      originalPrompt: prompt,
      generatedContent,
      relatedEntityId,
      relatedEntityType,
      modelName,
      modelVersion,
      parameters: parameters || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actor.id, // from the token, never the body
      status: 'draft',
      tags: Array.isArray(tags) ? tags : [],
      usageMetrics: { views: 0, conversions: 0, engagement: 0 },
    });

    const savedAIContent = await newAIContent.save();

    res.status(201).json({ status: 'success', data: savedAIContent });
  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error generating AI content',
    });
  }
});

/**
 * @route   PUT /api/ai-content/:id
 * @desc    Update AI content
 * @access  Private (operator only)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const actor = caller(req);
    if (!actor) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated.' });
    }

    if (!isOperator(req)) {
      return res
        .status(403)
        .json({ status: 'error', message: 'You do not have permission to update content.' });
    }

    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });

    if (!aiContent) {
      return res.status(404).json({ status: 'error', message: 'AI content not found' });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;

    /**
     * Only these columns may be written by an update. Everything else —
     * `contentId`, `status`, `createdBy`, `usageMetrics`, `feedback`,
     * `revisionHistory`, `createdAt` — is server-owned. Writing `status` here
     * would bypass `POST /:id/publish` and its "already published" guard;
     * writing `contentId` would relocate the row so the caller's own id stops
     * resolving to it.
     */
    const EDITABLE_FIELDS = [
      'generatedContent',
      'contentType',
      'originalPrompt',
      'relatedEntityId',
      'relatedEntityType',
      'modelName',
      'modelVersion',
      'parameters',
      'tags',
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] === undefined) continue;
      if (
        (field === 'generatedContent' || field === 'originalPrompt') &&
        typeof body[field] === 'string' &&
        (body[field] as string).length > MAX_TEXT_LENGTH
      ) {
        return res.status(400).json({
          status: 'error',
          message: `${field} exceeds the maximum length of ${MAX_TEXT_LENGTH} characters`,
        });
      }
      updates[field] = body[field];
    }

    // Revision history records the content being REPLACED, so it is computed
    // from the stored row, never from the request.
    if (
      typeof updates.generatedContent === 'string' &&
      updates.generatedContent !== aiContent.generatedContent
    ) {
      const history = aiContent.revisionHistory ?? [];
      history.push({
        version: history.length + 1,
        content: aiContent.generatedContent,
        prompt: aiContent.originalPrompt,
        timestamp: new Date(),
        // The reviser is the authenticated caller, not a body-supplied name.
        revisedBy: actor.id,
      });
      updates.revisionHistory = history;
    }

    updates.updatedAt = new Date();

    const updatedAIContent = await AIGeneratedContent.findOneAndUpdate(
      { contentId: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ status: 'success', data: updatedAIContent });
  } catch (error) {
    console.error('Error updating AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating AI content',
    });
  }
});

/**
 * @route   POST /api/ai-content/:id/publish
 * @desc    Publish AI content (change status from draft to published)
 * @access  Private (operator only)
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const actor = caller(req);
    if (!actor) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated.' });
    }

    if (!isOperator(req)) {
      return res
        .status(403)
        .json({ status: 'error', message: 'You do not have permission to publish content.' });
    }

    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });

    if (!aiContent) {
      return res.status(404).json({ status: 'error', message: 'AI content not found' });
    }

    if (aiContent.status === 'published') {
      return res.status(400).json({ status: 'error', message: 'Content is already published' });
    }

    aiContent.status = 'published';
    aiContent.updatedAt = new Date();

    await aiContent.save();

    res.json({
      status: 'success',
      message: 'AI content published successfully',
      data: aiContent,
    });
  } catch (error) {
    console.error('Error publishing AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error publishing AI content',
    });
  }
});

/**
 * @route   POST /api/ai-content/:id/feedback
 * @desc    Add user feedback to AI content
 * @access  Private (any authenticated user, recorded against the caller)
 */
router.post('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const actor = caller(req);
    if (!actor) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated.' });
    }

    const { rating, comments } = req.body ?? {};

    // `userId` in the body is ignored on purpose: feedback is attributed to the
    // caller. Trusting the body let one user post reviews as another.
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid rating (1-5)',
      });
    }

    if (comments !== undefined && typeof comments !== 'string') {
      return res.status(400).json({ status: 'error', message: 'comments must be a string' });
    }

    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });

    // Feedback targets published content only — a draft is not visible to the
    // caller, so acknowledging its existence via a feedback write would leak it.
    if (!aiContent || (aiContent.status !== 'published' && !isOperator(req))) {
      return res.status(404).json({ status: 'error', message: 'AI content not found' });
    }

    const feedback = aiContent.feedback ?? [];
    feedback.push({
      userId: actor.id, // from the token, never the body
      rating,
      comments,
      timestamp: new Date(),
    });
    aiContent.feedback = feedback;
    aiContent.updatedAt = new Date();

    await aiContent.save();

    res.json({
      status: 'success',
      message: 'Feedback added successfully',
      data: aiContent,
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error adding feedback',
    });
  }
});

/**
 * @route   DELETE /api/ai-content/:id
 * @desc    Delete AI content
 * @access  Private (admin only)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const contentId = req.params.id;
    const deletedContent = await AIGeneratedContent.findOneAndDelete({ contentId });

    if (!deletedContent) {
      return res.status(404).json({ status: 'error', message: 'Content not found' });
    }

    res.json({ status: 'success', message: 'Content deleted successfully' });
  } catch (error) {
    // The raw `error` object used to be serialised into the response, which
    // leaks stack traces and Mongo internals to the client.
    console.error('Error deleting AI content:', error);
    res.status(500).json({ status: 'error', message: 'Error deleting content' });
  }
});

export default router;
