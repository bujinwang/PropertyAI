import { Router } from 'express';
import PropertyController from '../controllers/propertyController';

/**
 * Legacy `/api/properties` surface, RESTORED as a compatibility view over
 * `Rental`. See `controllers/legacyRentalCrud.ts` for the field mapping and
 * the ownership hardening that this write path applies.
 *
 * All routes still sit behind the global `app.use('/api', requireAuth)` guard,
 * including `/public/listings` — that path is "public" by convention only.
 */
const router = Router();

router.get('/', PropertyController.getAllPropertys);
router.post('/', PropertyController.createProperty);
router.get('/public/listings', PropertyController.getPublicPropertys);
router.get('/:id', PropertyController.getPropertyById);
router.put('/:id', PropertyController.updateProperty);
router.delete('/:id', PropertyController.deleteProperty);

export default router;
