import { Router, Request, Response } from 'express';
import { User, UserRole } from '@prisma/client';
import TemplateService from '../services/templateService';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../config/database';

/**
 * Per-user dashboard templates.
 *
 * WHAT WAS WRONG
 * --------------
 * `router.use(authenticateToken)` established WHO the caller is; nothing
 * established WHAT they may touch. Three concrete holes:
 *
 *   1. `POST /` and `POST /save` took `userId` from the REQUEST BODY and handed
 *      it to Prisma, so a caller could file a template under another user's
 *      account (and `@@unique([userId, templateName])` means that also lets them
 *      squat a name the victim cannot then use).
 *   2. `GET /user/:userId` returned any user's templates to anyone.
 *   3. `PUT /:id`, `DELETE /:id`, `POST /:id/share` and `POST /:id/unshare` had
 *      no ownership check at all — any authenticated user could rewrite, delete,
 *      re-share or unshare another user's template.
 *
 * A SECOND, SEPARATE BUG LIVED IN THIS ROUTER'S MIDDLEWARE CHAIN
 * --------------------------------------------------------------
 * Every route passed `validateRequest` UNINVOKED. It was a factory
 * (`(rules) => (req,res,next) => ...`), so Express called the factory, got a
 * closure back, and never called `next()` — the request hung forever with no
 * response. Fixed at the definition (`middleware/validation.ts`), which also
 * repairs 3 other route files; see the comment there. The `express-validator`
 * chains that used to accompany it were dead weight on a no-op, so they are
 * gone rather than merely rewired.
 *
 * POLICY
 * ------
 * Templates are strictly per-user data (`UserTemplate.userId`). There is no
 * shared-tenant dimension, so ownership is a plain "is this row's userId me?"
 * check — no policy module needed. ADMIN may act on any template for support.
 *
 * `userId` is a tenancy key: NEVER accepted from the body, always stamped from
 * the authenticated token. `sharedWith` stays writable because sharing is the
 * feature, but only the owner may change it.
 */

const router = Router();

router.use(authenticateToken);

/** Caller identity, as set by `authenticateToken` (raw JWT payload). */
const callerId = (req: Request): string | undefined => (req.user as User | undefined)?.id;
const callerRole = (req: Request): UserRole | undefined =>
  (req.user as User | undefined)?.role;

const isAdmin = (req: Request): boolean => callerRole(req) === UserRole.ADMIN;

/**
 * Load a template and decide whether the caller may MUTATE it.
 * Returns the row, or writes 404/403 and returns null.
 *
 * Existence is checked before access so a legitimate owner who mistypes an id
 * gets a truthful 404 rather than a misleading 403.
 */
async function authorizeTemplate(
  req: Request,
  res: Response
): Promise<{ id: string; userId: string } | null> {
  const { id } = req.params;

  const template = await prisma.userTemplate.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found' });
    return null;
  }

  const me = callerId(req);
  if (!me) {
    res.status(401).json({ success: false, message: 'User not authenticated' });
    return null;
  }

  if (template.userId !== me && !isAdmin(req)) {
    res.status(403).json({
      success: false,
      message: 'You do not have access to this template',
    });
    return null;
  }

  return template;
}

/**
 * @route POST /api/templates
 * @desc Create a template owned by the CALLER.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { templateName, layout, role, isShared, sharedWith } = req.body ?? {};

    if (!templateName || typeof layout === 'undefined' || !role) {
      return res.status(400).json({
        success: false,
        message: 'templateName, layout and role are required',
      });
    }

    // `userId` is taken from the token, never the body.
    const template = await TemplateService.createTemplate({
      userId: me,
      templateName,
      layout,
      role,
      isShared: !!isShared,
      sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/templates/user/:userId
 * @desc List a user's own templates. Self, or ADMIN.
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    const { userId } = req.params;

    if (!me) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (userId !== me && !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'You may only list your own templates',
      });
    }

    const { role } = req.query;
    const templates = await TemplateService.getTemplatesByUser(userId, role as string);

    res.json({ success: true, data: templates, count: templates.length });
  } catch (error) {
    console.error('Error fetching templates by user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/templates/shared
 * @desc Templates shared with the calling user.
 */
router.get('/shared', async (req: Request, res: Response) => {
  try {
    const userId = callerId(req);
    const { role } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const templates = await TemplateService.getSharedTemplates(userId, role as string);

    res.json({ success: true, data: templates, count: templates.length });
  } catch (error) {
    console.error('Error fetching shared templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shared templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/templates/accessible
 * @desc Own + shared templates for the calling user.
 */
router.get('/accessible', async (req: Request, res: Response) => {
  try {
    const userId = callerId(req);
    const { role } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const templates = await TemplateService.getAccessibleTemplates(userId, role as string);

    res.json({ success: true, data: templates, count: templates.length });
  } catch (error) {
    console.error('Error fetching accessible templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accessible templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/templates/save
 * @desc Create-or-update a template owned by the CALLER.
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { templateName, layout, role } = req.body ?? {};
    if (!templateName || typeof layout === 'undefined' || !role) {
      return res.status(400).json({
        success: false,
        message: 'templateName, layout and role are required',
      });
    }

    // `userId` from the token — a body-supplied id would let a caller overwrite
    // a victim's template via the `@@unique([userId, templateName])` upsert key.
    const template = await TemplateService.saveTemplate(me, templateName, layout, role);

    res.json({ success: true, data: template, message: 'Template saved successfully' });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/templates/apply
 * @desc Pure layout validation — no persistence, no ownership needed.
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { layout, availableComponents } = req.body ?? {};
    const validatedLayout = TemplateService.applyTemplateLayout(layout, availableComponents);

    res.json({
      success: true,
      data: validatedLayout,
      message: 'Template layout applied successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/templates/search
 * @desc Search templates by name, limited to the caller's accessible set.
 * Declared BEFORE `/:id` so the literal segment is not swallowed by the param.
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Scoped to the CALLER. `userId` used to come from the query string, which
    // let a caller enumerate someone else's templates.
    const templates = await TemplateService.searchTemplates(q, me);

    res.json({ success: true, data: templates, count: templates.length });
  } catch (error) {
    console.error('Error searching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/templates/stats/overview
 * @desc Aggregate template statistics — operator-only.
 * Declared BEFORE `/:id` for the same reason as `/search`.
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const role = callerRole(req);
    const allowed: readonly (UserRole | undefined)[] = [
      UserRole.ADMIN,
      UserRole.PROPERTY_MANAGER,
    ];

    if (!allowed.includes(role)) {
      return res
        .status(403)
        .json({ success: false, message: 'You do not have access to template statistics' });
    }

    const stats = await TemplateService.getTemplateStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching template stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/templates/role/:role
 * @desc Templates for a role — operator-only (spans users).
 */
router.get('/role/:role', async (req: Request, res: Response) => {
  try {
    const role = callerRole(req);
    if (role !== UserRole.ADMIN && role !== UserRole.PROPERTY_MANAGER) {
      return res
        .status(403)
        .json({ success: false, message: 'You do not have access to templates by role' });
    }

    const templates = await TemplateService.getTemplatesByRole(req.params.role);
    res.json({ success: true, data: templates, count: templates.length });
  } catch (error) {
    console.error('Error fetching templates by role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates by role',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route GET /api/templates/:id
 * @desc Read one template. Owner or ADMIN.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await TemplateService.getTemplateById(req.params.id);

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const me = callerId(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (template.userId !== me && !isAdmin(req)) {
      return res
        .status(403)
        .json({ success: false, message: 'You do not have access to this template' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route PUT /api/templates/:id
 * @desc Update a template. Owner or ADMIN.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeTemplate(req, res);
    if (!authorized) return;

    const { templateName, layout, role, isShared, sharedWith } = req.body ?? {};

    // Whitelist. `userId` is deliberately absent: ownership is not transferable.
    const updateData: Record<string, unknown> = {};
    if (templateName !== undefined) updateData.templateName = templateName;
    if (layout !== undefined) updateData.layout = layout;
    if (role !== undefined) updateData.role = role;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (sharedWith !== undefined) updateData.sharedWith = sharedWith;

    const template = await TemplateService.updateTemplate(authorized.id, updateData as any);

    res.json({ success: true, data: template, message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/templates/:id/share
 * @desc Share a template. Owner or ADMIN.
 */
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeTemplate(req, res);
    if (!authorized) return;

    const { sharedWith } = req.body ?? {};
    if (!Array.isArray(sharedWith)) {
      return res
        .status(400)
        .json({ success: false, message: 'sharedWith must be an array of user IDs' });
    }

    const template = await TemplateService.shareTemplate(authorized.id, sharedWith);

    res.json({ success: true, data: template, message: 'Template shared successfully' });
  } catch (error) {
    console.error('Error sharing template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/templates/:id/unshare
 * @desc Unshare a template. Owner or ADMIN.
 */
router.post('/:id/unshare', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeTemplate(req, res);
    if (!authorized) return;

    const template = await TemplateService.unshareTemplate(authorized.id);

    res.json({ success: true, data: template, message: 'Template unshared successfully' });
  } catch (error) {
    console.error('Error unsharing template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unshare template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route POST /api/templates/:id/validate
 * @desc Validate a stored layout against available components. Owner or ADMIN.
 */
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeTemplate(req, res);
    if (!authorized) return;

    const template = await TemplateService.getTemplateById(authorized.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const { availableComponents } = req.body ?? {};
    const isValid = TemplateService.validateTemplateLayout(
      template.layout,
      availableComponents
    );

    res.json({
      success: true,
      data: { isValid, templateId: authorized.id },
      message: isValid
        ? 'Template layout is valid'
        : 'Template layout contains invalid components',
    });
  } catch (error) {
    console.error('Error validating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route DELETE /api/templates/:id
 * @desc Delete a template. Owner or ADMIN.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authorized = await authorizeTemplate(req, res);
    if (!authorized) return;

    await TemplateService.deleteTemplate(authorized.id);

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
