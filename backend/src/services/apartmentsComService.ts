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
  const unit = await prisma.unit.findFirst({ where: { listingId: listing.id } });
  const property = await prisma.property.findUnique({ where: { id: listing.propertyId } });

  return toXML({
    listing: {
      title: listing.title,
      description: listing.description,
      rent: listing.rent,
      url: `${process.env.FRONTEND_URL}/public-listing/${listing.slug}`,
      bedrooms: unit?.bedrooms,
      bathrooms: unit?.bathrooms,
      squareFootage: unit?.size,
      propertyType: property?.propertyType,
      isAvailable: listing.isActive,
      dateAvailable: listing.availableDate,
      address: property?.address,
      city: property?.city,
      state: property?.state,
      zipCode: property?.zipCode
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

// Legacy exports for backward compatibility
export { toApartmentsComFormatLegacy as toApartmentsComFormat };
