import { api } from './api';
import { Property } from '../types/property';
import { PropertyType } from '../types/property';

/**
 * @deprecated This service has been removed. Use rentalService instead.
 * All property functionality is now handled through the unified Rental model.
 * 
 * Migration guide:
 * - propertyService.getProperties() → rentalService.getRentals({ type: 'PROPERTY' })
 * - propertyService.getPropertyById(id) → rentalService.getRentalById(id)
 * - propertyService.createProperty(data) → rentalService.createRental({ ...data, type: 'PROPERTY' })
 * - propertyService.updateProperty(id, data) → rentalService.updateRental(id, data)
 * - propertyService.deleteProperty(id) → rentalService.deleteRental(id)
 */

import { rentalService } from './rentalService';

console.error('propertyService has been removed. Please use rentalService instead.');

export const propertyService = {
  getProperties: () => {
    throw new Error('propertyService.getProperties() has been removed. Use rentalService.getRentals({ type: "PROPERTY" }) instead.');
  },
  getPropertyById: () => {
    throw new Error('propertyService.getPropertyById() has been removed. Use rentalService.getRentalById() instead.');
  },
  createProperty: () => {
    throw new Error('propertyService.createProperty() has been removed. Use rentalService.createRental() instead.');
  },
  updateProperty: () => {
    throw new Error('propertyService.updateProperty() has been removed. Use rentalService.updateRental() instead.');
  },
  deleteProperty: () => {
    throw new Error('propertyService.deleteProperty() has been removed. Use rentalService.deleteRental() instead.');
  },
};
