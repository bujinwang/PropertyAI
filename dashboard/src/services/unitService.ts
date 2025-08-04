import axios from 'axios';
import { rentalService } from './rentalService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * @deprecated Use rentalService instead
 * Legacy unit service - all methods redirect to rentalService
 */

interface Unit {
  id: string;
  name: string;
  status: string;
  type: string;
  rent: number;
  address: string;
  description: string;
  amenities: string[];
}

export const getUnits = async (): Promise<Unit[]> => {
  console.warn('getUnits is deprecated. Use rentalService.getRentals with unit filter instead.');
  
  try {
    // Get rentals that represent units (have unitNumber)
    const result = await rentalService.getRentals({ unitNumber: { not: null } });
    
    // Map rentals to unit format for backward compatibility
    return result.rentals.map(rental => ({
      id: rental.id,
      name: rental.title,
      status: rental.status,
      type: rental.propertyType,
      rent: rental.rent,
      address: `${rental.address}, ${rental.city}, ${rental.state}`,
      description: rental.description || '',
      amenities: rental.amenities ? Object.keys(rental.amenities).filter(key => rental.amenities[key]) : []
    }));
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await axios.get(`${API_URL}/units`);
    return response.data as Unit[];
  }
};

export const getUnit = async (id: string): Promise<Unit> => {
  console.warn('getUnit is deprecated. Use rentalService.getRentalById instead.');
  
  try {
    const rental = await rentalService.getRentalById(id);
    if (rental && rental.unitNumber) {
      return {
        id: rental.id,
        name: rental.title,
        status: rental.status,
        type: rental.propertyType,
        rent: rental.rent,
        address: `${rental.address}, ${rental.city}, ${rental.state}`,
        description: rental.description || '',
        amenities: rental.amenities ? Object.keys(rental.amenities).filter(key => rental.amenities[key]) : []
      };
    }
    
    // Fallback to legacy API
    const response = await axios.get(`${API_URL}/units/${id}`);
    return response.data as Unit;
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await axios.get(`${API_URL}/units/${id}`);
    return response.data as Unit;
  }
};

export const createUnit = async (unit: any) => {
  console.warn('createUnit is deprecated. Use rentalService.createRental instead.');
  
  try {
    // Map unit data to rental data
    const rentalData = {
      title: unit.name || `Unit ${unit.unitNumber}`,
      description: unit.description,
      address: unit.address || '',
      city: unit.city || '',
      state: unit.state || '',
      zipCode: unit.zipCode || '',
      propertyType: unit.type || 'APARTMENT',
      unitNumber: unit.unitNumber,
      rent: unit.rent || 0,
      isAvailable: unit.isAvailable !== undefined ? unit.isAvailable : true,
      managerId: unit.managerId || '',
      ownerId: unit.ownerId || '',
      createdById: unit.createdById || ''
    };
    
    const rental = await rentalService.createRental(rentalData);
    return rental;
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await axios.post(`${API_URL}/units`, unit);
    return response.data;
  }
};

export const updateUnit = async (id: string, unit: any) => {
  console.warn('updateUnit is deprecated. Use rentalService.updateRental instead.');
  
  try {
    // Map unit data to rental data
    const rentalData = {
      title: unit.name,
      description: unit.description,
      rent: unit.rent,
      isAvailable: unit.isAvailable,
      amenities: unit.amenities ? 
        unit.amenities.reduce((acc: any, amenity: string) => ({ ...acc, [amenity]: true }), {}) : 
        undefined
    };
    
    const rental = await rentalService.updateRental(id, rentalData);
    return rental;
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await axios.put(`${API_URL}/units/${id}`, unit);
    return response.data;
  }
};

export const deleteUnit = async (id: string) => {
  console.warn('deleteUnit is deprecated. Use rentalService.deleteRental instead.');
  
  try {
    await rentalService.deleteRental(id);
    return { success: true };
  } catch (error) {
    // Fallback to legacy API
    console.warn('Falling back to legacy unit API');
    const response = await axios.delete(`${API_URL}/units/${id}`);
    return response.data;
  }
};
