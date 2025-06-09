import { Router } from 'express';
import ListingController from '../controllers/listingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware.protect, ListingController.getAllListings);
router.post('/', authMiddleware.protect, ListingController.createListing);
router.get('/:id', authMiddleware.protect, ListingController.getListingById);
router.put('/:id', authMiddleware.protect, ListingController.updateListing);
router.delete('/:id', authMiddleware.protect, ListingController.deleteListing);

export default router;
