import { Router } from 'express';
// import { managerController } from '../controllers/manager.controller';
// import { authMiddleware, rbacMiddleware } from '../middleware';

const router = Router();

// All routes in this file will be protected and restricted to managers
// router.use(authMiddleware.protect, rbacMiddleware(['PROPERTY_MANAGER', 'ADMIN']));

// router.get('/work-orders/:id/quotes', managerController.getQuotesForWorkOrder);
// router.post('/quotes/:id/approve', managerController.approveQuote);
// router.post('/quotes/:id/reject', managerController.rejectQuote);

export default router;