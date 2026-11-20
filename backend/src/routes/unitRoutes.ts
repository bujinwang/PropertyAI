import express from 'express';
import unitController from '../controllers/unitController';

/**
 * Legacy `/api/units` surface, RESTORED as a compatibility view over `Rental`.
 *
 * The deprecation middleware (`deprecationWarning`) and `legacyRouteMapper`
 * were removed when CRUD was restored. `legacyRouteMapper` in particular is not
 * harmless: it rewrites `req.query.type = 'unit'` on collection GETs, which
 * would silently distort filtering on a now-live endpoint. These paths are
 * first-class aliases again, not deprecation stubs.
 *
 * All routes still sit behind the global `app.use('/api', requireAuth)` guard.
 */
const router = express.Router();

/** @route GET /api/units — list rentals */
router.get('/', unitController.getAllUnits);

/** @route POST /api/units — create a rental (unitNumber is optional) */
router.post('/', unitController.createUnit);

/**
 * @route GET /api/units/property/:propertyId
 * The unified Rental model has no parent relation, so this is an unfiltered
 * list. Kept for route compatibility; see legacyRentalCrud.listByPropertyLegacy.
 */
router.get('/property/:propertyId', unitController.getUnitsByProperty);

/** @route GET /api/units/property/:propertyId/occupancy */
router.get('/property/:propertyId/occupancy', unitController.getPropertyOccupancy);

/** @route GET /api/units/:id */
router.get('/:id', unitController.getUnitById);

/** @route PUT /api/units/:id */
router.put('/:id', unitController.updateUnit);

/** @route PUT /api/units/:id/availability */
router.put('/:id/availability', unitController.setUnitAvailability);

/** @route PUT /api/units/:id/tenant — tenants live on Lease, not Rental */
router.put('/:id/tenant', unitController.assignTenant);

/**
 * @route DELETE /api/units/:id/tenant
 * This MUST NOT be `deleteUnit`: the old 410 stub made that mapping harmless,
 * but on a live surface it would delete the entire Rental row.
 */
router.delete('/:id/tenant', unitController.removeTenant);

/** @route DELETE /api/units/:id */
router.delete('/:id', unitController.deleteUnit);

export default router;
