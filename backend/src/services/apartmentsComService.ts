import { Listing, PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import { toXML } from 'jstoxml';

const prisma = new PrismaClient();

const APARTMENTS_COM_API_URL = 'https://api.apartments.com/v1';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${process.env.APARTMENTS_COM_API_KEY}`,
  'Content-Type': 'application/xml',
});

const toApartmentsComFormat = async (listing: Listing) => {
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
      isAvailable: listing.isAvailable,
      dateAvailable: listing.dateAvailable,
    },
  });
};

export const publishToApartmentsCom = async (listing: Listing) => {
  const response = await fetch(`${APARTMENTS_COM_API_URL}/import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: await toApartmentsComFormat(listing),
  });

  if (!response.ok) {
    throw new AppError('Failed to publish to Apartments.com', response.status);
  }

  return response.text();
};

export const getApartmentsComps = async (propertyId: string) => {
  const response = await fetch(`${APARTMENTS_COM_API_URL}/properties/${propertyId}/comps`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new AppError('Failed to get comps from Apartments.com', response.status);
  }

  return response.json();
};

export const deleteFromApartmentsCom = async (listingId: string) => {
  const response = await fetch(`${APARTMENTS_COM_API_URL}/delete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: toXML({ listingId }),
  });

  if (!response.ok) {
    throw new AppError('Failed to delete from Apartments.com', response.status);
  }

  return response.text();
};
