import { Router } from 'express';
import { RentalController } from '../controllers/rentalController';
import { authMiddleware } from '../middleware/authMiddleware';
import { deprecationWarning } from '../middleware/deprecation';

const router = Router();
const rentalController = new RentalController();

// Public routes (no authentication required)
router.get('/public', rentalController.getPublicRentals.bind(rentalController));
router.get('/public/:id', rentalController.getPublicRentalById.bind(rentalController));

// Protected routes (authentication required)
router.use(authMiddleware.protect);

// CRUD operations
router.get('/', rentalController.getRentals.bind(rentalController));
router.post('/', rentalController.createRental.bind(rentalController));
router.get('/:id', rentalController.getRentalById.bind(rentalController));
router.put('/:id', rentalController.updateRental.bind(rentalController));
router.delete('/:id', rentalController.deleteRental.bind(rentalController));

// Manager-specific routes
router.get('/manager/:managerId', rentalController.getRentalsByManager.bind(rentalController));

// Owner-specific routes
router.get('/owner/:ownerId', rentalController.getRentalsByOwner.bind(rentalController));

// Search and filtering
router.post('/search', rentalController.searchRentals.bind(rentalController));

// Bulk operations
router.post('/bulk', rentalController.bulkCreateRentals.bind(rentalController));
router.put('/bulk', rentalController.bulkUpdateRentals.bind(rentalController));
router.delete('/bulk', rentalController.bulkDeleteRentals.bind(rentalController));

// Analytics
router.get('/analytics/summary', rentalController.getRentalAnalytics.bind(rentalController));

export default router;