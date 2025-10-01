import { Router } from 'express';
import { managerController } from '../controllers/manager.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { rbacMiddleware } from '../middleware/rbacMiddleware';

const router = Router();

// Add logging to see if routes are being registered
console.log('Manager routes module loaded');

// Apply authentication and authorization middleware
router.use(authMiddleware.protect, rbacMiddleware(['PROPERTY_MANAGER', 'ADMIN']));

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  console.log('Manager test endpoint hit');
  res.json({ message: 'Manager routes are working!', timestamp: new Date().toISOString() });
});

router.get('/work-orders/:id/quotes', (req, res, next) => {
  console.log('Manager quotes endpoint hit with ID:', req.params.id);
  managerController.getQuotesForWorkOrder(req, res).catch(next);
});

router.post('/quotes/:id/approve', (req, res, next) => {
  console.log('Manager approve quote endpoint hit with ID:', req.params.id);
  managerController.approveQuote(req, res).catch(next);
});

router.post('/quotes/:id/reject', (req, res, next) => {
  console.log('Manager reject quote endpoint hit with ID:', req.params.id);
  managerController.rejectQuote(req, res).catch(next);
});

console.log('Manager routes configured');

export default router;