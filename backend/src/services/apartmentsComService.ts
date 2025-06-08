import { Listing } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import { toXML } from 'jstoxml';

const APARTMENTS_COM_API_URL = 'https://api.apartments.com/v1';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${process.env.APARTMENTS_COM_API_KEY}`,
  'Content-Type': 'application/xml',
});

const toApartmentsComFormat = (listing: Listing) => {
  // This is a placeholder for the actual data mapping.
  // You would map your unified listing model to the Apartments.com XML format here.
  return toXML({
    listing: {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      // ... other fields
    },
  });
};

export const publishToApartmentsCom = async (listing: Listing) => {
  const response = await fetch(`${APARTMENTS_COM_API_URL}/import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: toApartmentsComFormat(listing),
  });

  if (!response.ok) {
    throw new AppError('Failed to publish to Apartments.com', response.status);
  }

  return response.text();
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
