import { Router } from 'express';
import { TemplateService } from '../services/templateService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route POST /api/templates
 * @desc Create a new user template
 * @access Private
 */
router.post('/',
  [
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('templateName').isString().notEmpty().withMessage('Template name is required'),
    body('layout').isObject().withMessage('Layout must be a valid JSON object'),
    body('role').isString().notEmpty().withMessage('Role is required'),
    body('isShared').optional().isBoolean().withMessage('isShared must be a boolean'),
    body('sharedWith').optional().isArray().withMessage('sharedWith must be an array'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const templateData = req.body;

      const template = await TemplateService.createTemplate(templateData);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully'
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/templates/:id
 * @desc Get template by ID
 * @access Private
 */
router.get('/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const template = await TemplateService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/templates/user/:userId
 * @desc Get all templates for a user
 * @access Private
 */
router.get('/user/:userId',
  [
    param('userId').isString().notEmpty().withMessage('User ID is required'),
    query('role').optional().isString().withMessage('Role must be a string'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.query;

      const templates = await TemplateService.getTemplatesByUser(userId, role as string);

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error fetching templates by user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/templates/shared
 * @desc Get shared templates accessible to current user
 * @access Private
 */
router.get('/shared',
  [
    query('role').optional().isString().withMessage('Role must be a string'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = req.user?.id; // Assuming user is set by auth middleware
      const { role } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const templates = await TemplateService.getSharedTemplates(userId, role as string);

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error fetching shared templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shared templates',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/templates/accessible
 * @desc Get all templates accessible to current user (own + shared)
 * @access Private
 */
router.get('/accessible',
  [
    query('role').optional().isString().withMessage('Role must be a string'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const userId = req.user?.id; // Assuming user is set by auth middleware
      const { role } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const templates = await TemplateService.getAccessibleTemplates(userId, role as string);

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error fetching accessible templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch accessible templates',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/templates/:id
 * @desc Update template
 * @access Private
 */
router.put('/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('templateName').optional().isString().notEmpty().withMessage('Template name cannot be empty'),
    body('layout').optional().isObject().withMessage('Layout must be a valid JSON object'),
    body('role').optional().isString().notEmpty().withMessage('Role cannot be empty'),
    body('isShared').optional().isBoolean().withMessage('isShared must be a boolean'),
    body('sharedWith').optional().isArray().withMessage('sharedWith must be an array'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const template = await TemplateService.updateTemplate(id, updateData);

      res.json({
        success: true,
        data: template,
        message: 'Template updated successfully'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/templates/save
 * @desc Save template (create or update existing)
 * @access Private
 */
router.post('/save',
  [
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('templateName').isString().notEmpty().withMessage('Template name is required'),
    body('layout').isObject().withMessage('Layout must be a valid JSON object'),
    body('role').isString().notEmpty().withMessage('Role is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { userId, templateName, layout, role } = req.body;

      const template = await TemplateService.saveTemplate(userId, templateName, layout, role);

      res.json({
        success: true,
        data: template,
        message: 'Template saved successfully'
      });
    } catch (error) {
      console.error('Error saving template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save template',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/templates/:id/share
 * @desc Share template with users
 * @access Private
 */
router.post('/:id/share',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('sharedWith').isArray().withMessage('sharedWith must be an array of user IDs'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sharedWith } = req.body;

      const template = await TemplateService.shareTemplate(id, sharedWith);

      res.json({
        success: true,
        data: template,
        message: 'Template shared successfully'
      });
    } catch (error) {
      console.error('Error sharing template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to share template',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/templates/:id/unshare
 * @desc Unshare template
 * @access Private
 */
router.post('/:id/unshare',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const template = await TemplateService.unshareTemplate(id);

      res.json({
        success: true,
        data: template,
        message: 'Template unshared successfully'
      });
    } catch (error) {
      console.error('Error unsharing template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unshare template',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/templates/:id
 * @desc Delete template
 * @access Private
 */
router.delete('/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      await TemplateService.deleteTemplate(id);

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/templates/role/:role
 * @desc Get templates by role
 * @access Private
 */
router.get('/role/:role',
  [
    param('role').isString().notEmpty().withMessage('Role is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { role } = req.params;

      const templates = await TemplateService.getTemplatesByRole(role);

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error fetching templates by role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates by role',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/templates/:id/validate
 * @desc Validate template layout
 * @access Private
 */
router.post('/:id/validate',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('availableComponents').isArray().withMessage('availableComponents must be an array'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { availableComponents } = req.body;

      // Get template
      const template = await TemplateService.getTemplateById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Validate layout
      const isValid = TemplateService.validateTemplateLayout(template.layout, availableComponents);

      res.json({
        success: true,
        data: {
          isValid,
          templateId: id
        },
        message: isValid ? 'Template layout is valid' : 'Template layout contains invalid components'
      });
    } catch (error) {
      console.error('Error validating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate template',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/templates/apply
 * @desc Apply template layout (validate and return)
 * @access Private
 */
router.post('/apply',
  [
    body('layout').isObject().withMessage('Layout must be a valid JSON object'),
    body('availableComponents').isArray().withMessage('availableComponents must be an array'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { layout, availableComponents } = req.body;

      const validatedLayout = TemplateService.applyTemplateLayout(layout, availableComponents);

      res.json({
        success: true,
        data: validatedLayout,
        message: 'Template layout applied successfully'
      });
    } catch (error) {
      console.error('Error applying template layout:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/templates/search
 * @desc Search templates by name
 * @access Private
 */
router.get('/search',
  [
    query('q').isString().notEmpty().withMessage('Search query is required'),
    query('userId').optional().isString().withMessage('User ID must be a string'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { q: query, userId } = req.query;

      const templates = await TemplateService.searchTemplates(query as string, userId as string);

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error searching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search templates',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/templates/stats/overview
 * @desc Get template statistics
 * @access Private
 */
router.get('/stats/overview',
  async (req, res) => {
    try {
      const stats = await TemplateService.getTemplateStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching template stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template statistics',
        error: error.message
      });
    }
  }
);

export default router;
