import { Router } from 'express';
import ListingController from '../controllers/listingController';
import { authMiddleware } from '../middleware/authMiddleware';
import { deprecationWarning } from '../middleware/deprecation';
import { legacyRouteMapper } from '../middleware/legacy-mapping';

const router = Router();

// Apply deprecation warning to all routes
router.use(deprecationWarning('/api/rentals', '2024-05-01'));

// Apply legacy route mapping
router.use(legacyRouteMapper);

/**
 * @deprecated Use /api/rentals instead
 */
router.get('/', authMiddleware.protect, ListingController.getAllListings);

/**
 * @deprecated Use /api/rentals instead
 */
router.post('/', authMiddleware.protect, ListingController.createListing);

/**
 * @deprecated Use /api/rentals/:id instead
 */
router.get('/:id', authMiddleware.protect, ListingController.getListingById);

/**
 * @deprecated Use /api/rentals/:id instead
 */
router.put('/:id', authMiddleware.protect, ListingController.updateListing);

/**
 * @deprecated Use /api/rentals/:id instead
 */
router.delete('/:id', authMiddleware.protect, ListingController.deleteListing);

export default router;
