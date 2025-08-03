import { Rental } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

const ZILLOW_API_URL = 'https://api.zillow.com/v1';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${process.env.ZILLOW_CLIENT_SECRET}`,
  'Content-Type': 'application/json',
});

const toZillowFormat = (rental: Rental) => {
  return {
    title: rental.title,
    description: rental.description || '',
    price: rental.rent,
    url: `${process.env.FRONTEND_URL}/public-listing/${rental.slug}`,
    address: rental.address,
    city: rental.city,
    state: rental.state,
    zipCode: rental.zipCode,
    propertyType: rental.propertyType,
    bedrooms: rental.bedrooms,
    bathrooms: rental.bathrooms,
    squareFootage: rental.size,
    yearBuilt: rental.yearBuilt,
    amenities: rental.amenities,
    isAvailable: rental.isAvailable,
    availableDate: rental.availableDate,
    leaseTerms: rental.leaseTerms
  };
};

// Legacy function for backward compatibility
const toZillowFormatLegacy = (listing: any) => {
  return {
    title: listing.title,
    description: listing.description,
    price: listing.rent,
    url: `${process.env.FRONTEND_URL}/public-listing/${listing.slug}`,
    // ... other legacy fields
  };
};

export const publishToZillow = async (rental: Rental): Promise<any> => {
  try {
    const zillowData = toZillowFormat(rental);
    
    const response = await fetch(`${ZILLOW_API_URL}/listings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(zillowData),
    });

    if (!response.ok) {
      throw new AppError(`Zillow API error: ${response.statusText}`, response.status);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error publishing to Zillow:', error);
    throw new AppError(error.message || 'Failed to publish to Zillow', error.status || 500);
  }
};

export const updateZillowListing = async (rental: Rental, zillowListingId: string): Promise<any> => {
  try {
    const zillowData = toZillowFormat(rental);
    
    const response = await fetch(`${ZILLOW_API_URL}/listings/${zillowListingId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(zillowData),
    });

    if (!response.ok) {
      throw new AppError(`Zillow API error: ${response.statusText}`, response.status);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error updating Zillow listing:', error);
    throw new AppError(error.message || 'Failed to update Zillow listing', error.status || 500);
  }
};

export const removeFromZillow = async (zillowListingId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${ZILLOW_API_URL}/listings/${zillowListingId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new AppError(`Zillow API error: ${response.statusText}`, response.status);
    }

    return true;
  } catch (error: any) {
    console.error('Error removing from Zillow:', error);
    throw new AppError(error.message || 'Failed to remove from Zillow', error.status || 500);
  }
};

// Legacy exports for backward compatibility
export { toZillowFormatLegacy as toZillowFormat };
