import { Router } from 'express';
import ListingController from '../controllers/listingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, ListingController.getAllListings);
router.post('/', authMiddleware, ListingController.createListing);
router.get('/:id', authMiddleware, ListingController.getListingById);
router.put('/:id', authMiddleware, ListingController.updateListing);
router.delete('/:id', authMiddleware, ListingController.deleteListing);

export default router;
