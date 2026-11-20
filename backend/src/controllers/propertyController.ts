/**
 * Property controller — restored as a compatibility view over `Rental`.
 *
 * The schema has no `Property` model: properties were consolidated into
 * `Rental` (`20250804155618_rental`). This controller used to alias every
 * handler to a 410 `deprecatedResponse`. CRUD has been restored by delegating
 * to the shared adapter in `legacyRentalCrud.ts`, which maps the legacy payload
 * onto `Rental` and returns the `{ status, data }` envelope the clients expect.
 *
 * Export NAMES are intentionally unchanged: `routes/propertyRoutes.ts` imports
 * the default object and references these keys. Renaming one would break the
 * route at load time.
 */
import {
  listRentals,
  createRentalFromLegacy,
  getRentalByIdLegacy,
  updateRentalFromLegacy,
  deleteRentalByIdLegacy,
  setAvailabilityFromLegacy,
  listByPropertyLegacy,
  occupancyNotSupported,
  tenantAssignmentNotSupported,
} from './legacyRentalCrud';

export const getAllPropertys = listRentals;
export const getPublicPropertys = listRentals;
export const createProperty = createRentalFromLegacy;
export const getPropertyById = getRentalByIdLegacy;
export const updateProperty = updateRentalFromLegacy;
export const deleteProperty = deleteRentalByIdLegacy;

// Kept for parity with the unit router's extended surface, even though the
// property router does not currently mount these paths.
export const setPropertyAvailability = setAvailabilityFromLegacy;
export const getPropertysByParent = listByPropertyLegacy;
export const getPropertyOccupancy = occupancyNotSupported;
export const assignPropertyTenant = tenantAssignmentNotSupported;
export const removePropertyTenant = tenantAssignmentNotSupported;

export default {
  getAllPropertys,
  getPublicPropertys,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
  setPropertyAvailability,
  getPropertysByParent,
  getPropertyOccupancy,
  assignPropertyTenant,
  removePropertyTenant,
};
