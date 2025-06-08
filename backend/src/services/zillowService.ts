import { Listing } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

const ZILLOW_API_URL = 'https://api.zillow.com/v1';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${process.env.ZILLOW_CLIENT_SECRET}`,
  'Content-Type': 'application/json',
});

const toZillowFormat = (listing: Listing) => {
  // This is a placeholder for the actual data mapping.
  // You would map your unified listing model to the Zillow API format here.
  return {
    title: listing.title,
    description: listing.description,
    price: listing.price,
    // ... other fields
  };
};

export const publishToZillow = async (listing: Listing) => {
  const response = await fetch(`${ZILLOW_API_URL}/listings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(toZillowFormat(listing)),
  });

  if (!response.ok) {
    throw new AppError('Failed to publish to Zillow', response.status);
  }

  return response.json();
};

export const updateOnZillow = async (zillowListingId: string, listing: Listing) => {
  const response = await fetch(`${ZILLOW_API_URL}/listings/${zillowListingId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(toZillowFormat(listing)),
  });

  if (!response.ok) {
    throw new AppError('Failed to update on Zillow', response.status);
  }

  return response.json();
};

export const deleteFromZillow = async (zillowListingId: string) => {
  const response = await fetch(`${ZILLOW_API_URL}/listings/${zillowListingId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new AppError('Failed to delete from Zillow', response.status);
  }

  return response.json();
};
