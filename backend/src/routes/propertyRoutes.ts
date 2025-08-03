import { Router } from 'express';
import PropertyController from '../controllers/propertyController';
import { authMiddleware } from '../middleware/authMiddleware';
import { deprecationWarning } from '../middleware/deprecation';
import { legacyRouteMapper } from '../middleware/legacy-mapping';

const router = Router();

// Apply deprecation warning to all routes
router.use(deprecationWarning('/api/rentals', '2024-05-01'));

// Apply legacy route mapping
router.use(legacyRouteMapper);

// GET / route with role-based access
router.get('/', (req, res, next) => {
  // Check if public view is requested
  if (req.query.public === 'true') {
    return PropertyController.getPublicProperties(req, res);
  }
  
  // Otherwise, require authentication for full data access
  authMiddleware.protect(req, res, next);
}, PropertyController.getAllProperties);

// Other routes remain protected
router.post('/', authMiddleware.protect, PropertyController.createProperty);
router.get('/:id', authMiddleware.protect, PropertyController.getPropertyById);
router.put('/:id', authMiddleware.protect, PropertyController.updateProperty);
router.delete('/:id', authMiddleware.protect, PropertyController.deleteProperty);

// Dedicated public endpoint
router.get('/public/listings', PropertyController.getPublicProperties);

export default router;
