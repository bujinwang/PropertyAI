
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { VisitorController, DeliveryController, VisitorAccessController } from '../controllers';
import { validateRequest } from '../middleware/validation';
import { 
  createVisitorValidation, 
  updateVisitorValidation, 
  createDeliveryValidation, 
  updateDeliveryValidation,
  accessLogValidation,
  deliveryAccessLogValidation
} from '../validation/visitorValidation';

const router = express.Router();

// Create controller instances
const visitorController = new VisitorController();
const deliveryController = new DeliveryController();
const visitorAccessController = new VisitorAccessController();

// Visitor Management Routes
/**
 * @route   GET /api/visitors
 * @desc    Get all visitors for the authenticated user's rental
 * @access  Private
 */
router.get('/visitors', authenticateToken, (req, res) => visitorController.getVisitors(req, res));

/**
 * @route   GET /api/visitors/:id
 * @desc    Get a specific visitor by ID
 * @access  Private
 */
router.get('/visitors/:id', authenticateToken, (req, res) => visitorController.getVisitorById(req, res));

/**
 * @route   POST /api/visitors
 * @desc    Create a new visitor request
 * @access  Private
 */
router.post('/visitors', 
  authenticateToken, 
  validateRequest(createVisitorValidation), 
  (req, res) => visitorController.createVisitor(req, res)
);

/**
 * @route   PUT /api/visitors/:id
 * @desc    Update a visitor request
 * @access  Private (Property Manager, Admin)
 */
router.put('/visitors/:id', 
  authenticateToken, 
  validateRequest(updateVisitorValidation), 
  (req, res) => visitorController.updateVisitor(req, res)
);

/**
 * @route   PUT /api/visitors/:id/approve
 * @desc    Approve a visitor request
 * @access  Private (Property Manager, Admin)
 */
router.put('/visitors/:id/approve', authenticateToken, (req, res) => visitorController.approveVisitor(req, res));

/**
 * @route   PUT /api/visitors/:id/deny
 * @desc    Deny a visitor request
 * @access  Private (Property Manager, Admin)
 */
router.put('/visitors/:id/deny', authenticateToken, (req, res) => visitorController.denyVisitor(req, res));

/**
 * @route   DELETE /api/visitors/:id
 * @desc    Delete a visitor request
 * @access  Private (Property Manager, Admin)
 */
router.delete('/visitors/:id', authenticateToken, (req, res) => visitorController.deleteVisitor(req, res));

// Delivery Management Routes
/**
 * @route   GET /api/deliveries
 * @desc    Get all deliveries for the authenticated user's rental
 * @access  Private
 */
router.get('/deliveries', authenticateToken, (req, res) => deliveryController.getDeliveries(req, res));

/**
 * @route   GET /api/deliveries/:id
 * @desc    Get a specific delivery by ID
 * @access  Private
 */
router.get('/deliveries/:id', authenticateToken, (req, res) => deliveryController.getDeliveryById(req, res));

/**
 * @route   POST /api/deliveries
 * @desc    Create a new delivery tracking entry
 * @access  Private (Property Manager, Admin)
 */
router.post('/deliveries', 
  authenticateToken, 
  validateRequest(createDeliveryValidation), 
  (req, res) => deliveryController.createDelivery(req, res)
);

/**
 * @route   PUT /deliveries/:id
 * @desc    Update a delivery tracking entry
 * @access  Private (Property Manager, Admin)
 */
router.put('/deliveries/:id', 
  authenticateToken, 
  validateRequest(updateDeliveryValidation), 
  (req, res) => deliveryController.updateDelivery(req, res)
);

/**
 * @route   PUT /api/deliveries/:id/pickup
 * @desc    Mark a delivery as picked up
 * @access  Private
 */
router.put('/deliveries/:id/pickup', authenticateToken, (req, res) => deliveryController.markAsPickedUp(req, res));

/**
 * @route   DELETE /api/deliveries/:id
 * @desc    Delete a delivery tracking entry
 * @access  Private (Property Manager, Admin)
 */
router.delete('/deliveries/:id', authenticateToken, (req, res) => deliveryController.deleteDelivery(req, res));

// Access Control Routes
/**
* @route   GET /api/access-logs/visitors/:visitorId
* @desc    Get visitor access logs
* @access  Private
*/
router.get('/access-logs/visitors/:visitorId', authenticateToken, (req, res) => visitorAccessController.getVisitorAccessLogs(req, res));

/**
* @route   POST /api/access-logs/visitors
* @desc    Log visitor access
* @access  Private
*/
router.post('/access-logs/visitors',
 authenticateToken,
 validateRequest(accessLogValidation),
 (req, res) => visitorAccessController.logVisitorAccess(req, res)
);

/**
* @route   GET /api/access-logs/deliveries/:deliveryId
* @desc    Get delivery access logs
* @access  Private
*/
router.get('/access-logs/deliveries/:deliveryId', authenticateToken, (req, res) => visitorAccessController.getDeliveryAccessLogs(req, res));

/**
* @route   POST /api/access-logs/deliveries
* @desc    Log delivery access
* @access  Private
*/
router.post('/access-logs/deliveries',
 authenticateToken,
 validateRequest(deliveryAccessLogValidation),
 (req, res) => visitorAccessController.logDeliveryAccess(req, res)
);

export default router;