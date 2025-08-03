import { Rental, PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import { toXML } from 'jstoxml';

const prisma = new PrismaClient();

const APARTMENTS_COM_API_URL = 'https://api.apartments.com/v1';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${process.env.APARTMENTS_COM_API_KEY}`,
  'Content-Type': 'application/xml',
});

const toApartmentsComFormat = (rental: Rental) => {
  return toXML({
    listing: {
      title: rental.title,
      description: rental.description || '',
      rent: rental.rent,
      url: `${process.env.FRONTEND_URL}/public-listing/${rental.slug}`,
      bedrooms: rental.bedrooms,
      bathrooms: rental.bathrooms,
      squareFootage: rental.size,
      propertyType: rental.propertyType,
      isAvailable: rental.isAvailable,
      dateAvailable: rental.availableDate,
      address: rental.address,
      city: rental.city,
      state: rental.state,
      zipCode: rental.zipCode,
      yearBuilt: rental.yearBuilt,
      amenities: rental.amenities,
      leaseTerms: rental.leaseTerms,
      deposit: rental.deposit
    }
  });
};

// Legacy function for backward compatibility
const toApartmentsComFormatLegacy = async (listing: any) => {
  // Try to find the rental that corresponds to this listing
  const rental = await prisma.rental.findFirst({ 
    where: { 
      // Assuming there's some way to link listing to rental
      // This might need adjustment based on your actual data structure
      id: listing.rentalId || listing.id
    } 
  });

  if (rental) {
    return toApartmentsComFormat(rental);
  }

  // Fallback to constructing from listing data if no rental found
  return toXML({
    listing: {
      title: listing.title,
      description: listing.description,
      rent: listing.rent,
      url: `${process.env.FRONTEND_URL}/public-listing/${listing.slug}`,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      squareFootage: listing.size,
      propertyType: listing.propertyType,
      isAvailable: listing.isActive,
      dateAvailable: listing.availableDate,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zipCode: listing.zipCode
    }
  });
};

export const publishToApartmentsCom = async (rental: Rental): Promise<any> => {
  try {
    const apartmentsComData = toApartmentsComFormat(rental);
    
    const response = await fetch(`${APARTMENTS_COM_API_URL}/listings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: apartmentsComData,
    });

    if (!response.ok) {
      throw new AppError(`Apartments.com API error: ${response.statusText}`, response.status);
    }

    return await response.text(); // Apartments.com typically returns XML
  } catch (error: any) {
    console.error('Error publishing to Apartments.com:', error);
    throw new AppError(error.message || 'Failed to publish to Apartments.com', error.status || 500);
  }
};

export const updateApartmentsComListing = async (rental: Rental, apartmentsComListingId: string): Promise<any> => {
  try {
    const apartmentsComData = toApartmentsComFormat(rental);
    
    const response = await fetch(`${APARTMENTS_COM_API_URL}/listings/${apartmentsComListingId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: apartmentsComData,
    });

    if (!response.ok) {
      throw new AppError(`Apartments.com API error: ${response.statusText}`, response.status);
    }

    return await response.text();
  } catch (error: any) {
    console.error('Error updating Apartments.com listing:', error);
    throw new AppError(error.message || 'Failed to update Apartments.com listing', error.status || 500);
  }
};

export const removeFromApartmentsCom = async (apartmentsComListingId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${APARTMENTS_COM_API_URL}/listings/${apartmentsComListingId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new AppError(`Apartments.com API error: ${response.statusText}`, response.status);
    }

    return true;
  } catch (error: any) {
    console.error('Error removing from Apartments.com:', error);
    throw new AppError(error.message || 'Failed to remove from Apartments.com', error.status || 500);
  }
};

export const getApartmentsComps = async (rentalId: string): Promise<any> => {
  try {
    // For now, return a placeholder response since Apartments.com doesn't have a direct comps API
    // This would need to be implemented based on Apartments.com's actual API capabilities
    console.log(`Getting comparable properties for rental ${rentalId} from Apartments.com`);
    
    return {
      source: 'apartments.com',
      rentalId,
      comparables: [],
      message: 'Apartments.com comparable properties feature not yet implemented'
    };
  } catch (error: any) {
    console.error('Error getting Apartments.com comps:', error);
    throw new AppError(error.message || 'Failed to get Apartments.com comparables', error.status || 500);
  }
};

// Legacy exports for backward compatibility
export { toApartmentsComFormatLegacy as toApartmentsComFormat };
