/**
 * Unit controller — restored as a compatibility view over `Rental`.
 *
 * The schema has no `Unit` model: units are `Rental` rows carrying a
 * `unitNumber`. This controller used to alias all 13 handlers to a 410
 * `deprecatedResponse`. CRUD has been restored by delegating to the shared
 * adapter in `legacyRentalCrud.ts`.
 *
 * Export NAMES are intentionally unchanged because `routes/unitRoutes.ts`
 * references them through the default object. The relationship helpers are
 * deliberately NOT aliased to the destructive handlers: before this restore,
 * `DELETE /api/units/:id/tenant` pointed at `deleteUnit`, which would have
 * deleted the entire Rental row once the endpoint became live again.
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

export const getAllUnits = listRentals;
export const getUnits = listRentals;
export const getPublicUnits = listRentals;
export const createUnit = createRentalFromLegacy;
export const getUnitById = getRentalByIdLegacy;
export const updateUnit = updateRentalFromLegacy;
export const deleteUnit = deleteRentalByIdLegacy;

export const getUnitsByProperty = listByPropertyLegacy;
export const getPropertyOccupancy = occupancyNotSupported;
export const setUnitAvailability = setAvailabilityFromLegacy;
export const assignTenant = tenantAssignmentNotSupported;
export const removeTenant = tenantAssignmentNotSupported;

export default {
  getAllUnits,
  getUnits,
  createUnit,
  getUnitById,
  updateUnit,
  deleteUnit,
  getPublicUnits,
  getUnitsByProperty,
  getPropertyOccupancy,
  setUnitAvailability,
  assignTenant,
  removeTenant,
};
