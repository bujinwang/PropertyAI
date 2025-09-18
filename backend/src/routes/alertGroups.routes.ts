import { Router } from 'express';
import { AlertGroupingService } from '../services/alertGroupingService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route POST /api/alert-groups
 * @desc Create a new alert group
 * @access Private
 */
router.post('/',
  [
    body('groupType').isIn(['MAINTENANCE', 'CHURN', 'MARKET']).withMessage('Invalid group type'),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
    body('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('alertCount').optional().isInt({ min: 0 }).withMessage('Alert count must be a non-negative integer'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { groupType, priority, propertyId, alertCount } = req.body;

      const alertGroup = await AlertGroupingService.createAlertGroup({
        groupType,
        priority,
        propertyId,
        alertCount
      });

      res.status(201).json({
        success: true,
        data: alertGroup,
        message: 'Alert group created successfully'
      });
    } catch (error) {
      console.error('Error creating alert group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create alert group',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/alert-groups/:id
 * @desc Get alert group by ID
 * @access Private
 */
router.get('/:id',
  [
    param('id').isString().notEmpty().withMessage('Alert group ID is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const alertGroup = await AlertGroupingService.getAlertGroupById(id);

      if (!alertGroup) {
        return res.status(404).json({
          success: false,
          message: 'Alert group not found'
        });
      }

      res.json({
        success: true,
        data: alertGroup
      });
    } catch (error) {
      console.error('Error fetching alert group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert group',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/alert-groups/property/:propertyId
 * @desc Get all alert groups for a property
 * @access Private
 */
router.get('/property/:propertyId',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { propertyId } = req.params;

      const alertGroups = await AlertGroupingService.getAlertGroupsByProperty(propertyId);

      res.json({
        success: true,
        data: alertGroups,
        count: alertGroups.length
      });
    } catch (error) {
      console.error('Error fetching alert groups by property:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert groups',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/alert-groups/:id
 * @desc Update alert group
 * @access Private
 */
router.put('/:id',
  [
    param('id').isString().notEmpty().withMessage('Alert group ID is required'),
    body('groupType').optional().isIn(['MAINTENANCE', 'CHURN', 'MARKET']).withMessage('Invalid group type'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
    body('alertCount').optional().isInt({ min: 0 }).withMessage('Alert count must be a non-negative integer'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const alertGroup = await AlertGroupingService.updateAlertGroup(id, updateData);

      res.json({
        success: true,
        data: alertGroup,
        message: 'Alert group updated successfully'
      });
    } catch (error) {
      console.error('Error updating alert group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update alert group',
        error: error.message
      });
    }
  }
);

/**
 * @route PATCH /api/alert-groups/:id/increment
 * @desc Increment alert count for a group
 * @access Private
 */
router.patch('/:id/increment',
  [
    param('id').isString().notEmpty().withMessage('Alert group ID is required'),
    body('incrementBy').optional().isInt({ min: 1 }).withMessage('Increment value must be a positive integer'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { incrementBy = 1 } = req.body;

      const alertGroup = await AlertGroupingService.incrementAlertCount(id, incrementBy);

      res.json({
        success: true,
        data: alertGroup,
        message: 'Alert count incremented successfully'
      });
    } catch (error) {
      console.error('Error incrementing alert count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to increment alert count',
        error: error.message
      });
    }
  }
);

/**
 * @route PATCH /api/alert-groups/:id/decrement
 * @desc Decrement alert count for a group
 * @access Private
 */
router.patch('/:id/decrement',
  [
    param('id').isString().notEmpty().withMessage('Alert group ID is required'),
    body('decrementBy').optional().isInt({ min: 1 }).withMessage('Decrement value must be a positive integer'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { decrementBy = 1 } = req.body;

      const alertGroup = await AlertGroupingService.decrementAlertCount(id, decrementBy);

      res.json({
        success: true,
        data: alertGroup,
        message: 'Alert count decremented successfully'
      });
    } catch (error) {
      console.error('Error decrementing alert count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decrement alert count',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/alert-groups/:id
 * @desc Delete alert group
 * @access Private
 */
router.delete('/:id',
  [
    param('id').isString().notEmpty().withMessage('Alert group ID is required'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      await AlertGroupingService.deleteAlertGroup(id);

      res.json({
        success: true,
        message: 'Alert group deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting alert group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete alert group',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/alert-groups/stats/overview
 * @desc Get alert groups statistics
 * @access Private
 */
router.get('/stats/overview',
  async (req, res) => {
    try {
      const stats = await AlertGroupingService.getAlertGroupsStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching alert groups stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert groups statistics',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/alert-groups/high-priority
 * @desc Get high priority alert groups
 * @access Private
 */
router.get('/high-priority',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const alertGroups = await AlertGroupingService.getHighPriorityAlertGroups(limit);

      res.json({
        success: true,
        data: alertGroups,
        count: alertGroups.length
      });
    } catch (error) {
      console.error('Error fetching high priority alert groups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch high priority alert groups',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/alert-groups/cleanup
 * @desc Clean up empty alert groups
 * @access Private (Admin only)
 */
router.post('/cleanup',
  async (req, res) => {
    try {
      // TODO: Add admin role check middleware
      const result = await AlertGroupingService.cleanupEmptyAlertGroups();

      res.json({
        success: true,
        data: result,
        message: `${result.count} empty alert groups cleaned up`
      });
    } catch (error) {
      console.error('Error cleaning up empty alert groups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup empty alert groups',
        error: error.message
      });
    }
  }
);

export default router;
