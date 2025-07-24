import { Router } from 'express';
import { contractorController } from '../controllers/contractor.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { rbacMiddleware } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authMiddleware.protect, rbacMiddleware(['VENDOR']));

router.get('/work-orders', contractorController.getWorkOrders);
router.get('/work-orders/:id', contractorController.getWorkOrderDetails);
router.post('/work-orders/:id/accept', contractorController.acceptWorkOrder);
router.put('/work-orders/:id/status', contractorController.updateWorkOrderStatus);
router.post('/work-orders/:id/invoice', contractorController.submitInvoice);
router.post('/work-orders/:id/decline', contractorController.declineWorkOrder);
router.post('/work-orders/:id/quote', contractorController.submitQuote);

// Messaging routes
router.get('/work-orders/:id/messages', contractorController.getMessages);
router.post('/work-orders/:id/messages', contractorController.sendMessage);

export default router;