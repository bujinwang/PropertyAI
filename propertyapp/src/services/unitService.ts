import { api } from './api';
import { Unit, CreateUnitRequest, UpdateUnitRequest } from '../types/unit';
import { rentalService } from './rentalService';
import { Rental, CreateRentalDto, UpdateRentalDto } from '../types/rental';

/**
 * @deprecated Use rentalService instead
 * Legacy unit service - all methods redirect to rentalService
 */

const getUnits = async (): Promise<Unit[]> => {
  console.warn('unitService.getUnits is deprecated. Use rentalService.getRentals with unit filter instead.');
  
  try {
    // Get rentals that represent units (have unitNumber)
    const rentals = await rentalService.getRentals({ unitNumber: { not: null } });
    
    // Map rentals to unit format for backward compatibility
    return rentals.map(mapRentalToUnit);
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await api.get<Unit[]>('/units');
    return response;
  }
};

const getUnitById = async (id: string): Promise<Unit> => {
  console.warn('unitService.getUnitById is deprecated. Use rentalService.getRentalById instead.');
  
  try {
    // Try to find rental by ID first
    const rental = await rentalService.getRentalById(id);
    if (rental && rental.unitNumber) {
      return mapRentalToUnit(rental);
    }
    
    // Fallback to legacy API
    const response = await api.get<Unit>(`/units/${id}`);
    return response;
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await api.get<Unit>(`/units/${id}`);
    return response;
  }
};

const getPropertyUnits = async (propertyId: string): Promise<Unit[]> => {
  console.warn('unitService.getPropertyUnits is deprecated. Use rentalService.getRentals with property filter instead.');
  
  try {
    // Get rentals for this property that have unit numbers
    const rentals = await rentalService.getRentals({ 
      // Note: This would need proper property mapping logic
      unitNumber: { not: null }
    });
    
    return rentals.map(mapRentalToUnit);
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await api.get<Unit[]>(`/properties/${propertyId}/units`);
    return response;
  }
};

const createUnit = async (unitData: CreateUnitRequest): Promise<Unit> => {
  console.warn('unitService.createUnit is deprecated. Use rentalService.createRental instead.');
  
  try {
    // Map unit data to rental data
    const rentalData: CreateRentalDto = {
      title: `Unit ${unitData.unitNumber}`,
      description: unitData.description,
      address: unitData.address || '',
      city: unitData.city || '',
      state: unitData.state || '',
      zipCode: unitData.zipCode || '',
      propertyType: 'APARTMENT', // Default
      unitNumber: unitData.unitNumber,
      floorNumber: unitData.floorNumber,
      size: unitData.size,
      bedrooms: unitData.bedrooms,
      bathrooms: unitData.bathrooms,
      rent: unitData.rent || 0,
      deposit: unitData.deposit,
      isAvailable: unitData.isAvailable,
      amenities: unitData.features,
      managerId: unitData.managerId || '',
      ownerId: unitData.ownerId || '',
      createdById: unitData.createdById || ''
    };
    
    const rental = await rentalService.createRental(rentalData);
    return mapRentalToUnit(rental);
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await api.post<Unit>('/units', unitData);
    return response;
  }
};

const updateUnit = async (id: string, unitData: UpdateUnitRequest): Promise<Unit> => {
  console.warn('unitService.updateUnit is deprecated. Use rentalService.updateRental instead.');
  
  try {
    // Map unit data to rental data
    const rentalData: UpdateRentalDto = {
      title: unitData.unitNumber ? `Unit ${unitData.unitNumber}` : undefined,
      description: unitData.description,
      unitNumber: unitData.unitNumber,
      floorNumber: unitData.floorNumber,
      size: unitData.size,
      bedrooms: unitData.bedrooms,
      bathrooms: unitData.bathrooms,
      rent: unitData.rent,
      deposit: unitData.deposit,
      isAvailable: unitData.isAvailable,
      amenities: unitData.features
    };
    
    const rental = await rentalService.updateRental(id, rentalData);
    return mapRentalToUnit(rental);
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await api.put<Unit>(`/units/${id}`, unitData);
    return response;
  }
};

const deleteUnit = async (id: string): Promise<void> => {
  console.warn('unitService.deleteUnit is deprecated. Use rentalService.deleteRental instead.');
  
  try {
    await rentalService.deleteRental(id);
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    await api.delete(`/units/${id}`);
  }
};

const getUnitListings = async (unitId: string) => {
  console.warn('unitService.getUnitListings is deprecated. Unit listings are now part of the rental model.');
  
  try {
    // Get the rental (which represents the unit and its listing)
    const rental = await rentalService.getRentalById(unitId);
    return rental ? [rental] : [];
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await api.get(`/units/${unitId}/listings`);
    return response;
  }
};

const createUnitListing = async (unitId: string, listingData: any) => {
  console.warn('unitService.createUnitListing is deprecated. Update the rental directly using rentalService.updateRental.');
  
  try {
    // Update the rental with listing data
    const rentalData: UpdateRentalDto = {
      title: listingData.title,
      description: listingData.description,
      rent: listingData.rent,
      isAvailable: listingData.isAvailable,
      status: listingData.status
    };
    
    const rental = await rentalService.updateRental(unitId, rentalData);
    return rental;
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await api.post(`/units/${unitId}/listings`, listingData);
    return response;
  }
};

// Helper function to map rental to unit format for backward compatibility
const mapRentalToUnit = (rental: Rental): Unit => {
  return {
    id: rental.id,
    unitNumber: rental.unitNumber || '',
    propertyId: '', // Would need proper mapping
    floorNumber: rental.floorNumber,
    size: rental.size,
    bedrooms: rental.bedrooms,
    bathrooms: rental.bathrooms,
    rent: rental.rent,
    deposit: rental.deposit,
    isAvailable: rental.isAvailable,
    dateAvailable: rental.availableDate,
    features: rental.amenities,
    description: rental.description,
    address: rental.address,
    city: rental.city,
    state: rental.state,
    zipCode: rental.zipCode,
    createdAt: rental.createdAt,
    updatedAt: rental.updatedAt
  };
};

export const unitService = {
  getUnits,
  getUnitById,
  getPropertyUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitListings,
  createUnitListing,
};