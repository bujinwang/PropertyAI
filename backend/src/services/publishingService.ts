import { Rental } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import * as zillowService from './zillowService';
import * as apartmentsComService from './apartmentsComService';

const prisma = new PrismaClient();

/**
 * Publish rental to listing platforms
 * @param rental The rental object to publish
 * @param platforms Array of platform names
 * @returns Results for each platform
 */
export const publishRentalToListingPlatforms = async (rental: Rental, platforms: string[]) => {
  const results: any = {};

  if (platforms.includes('zillow')) {
    try {
      const result = await zillowService.publishRentalToZillow(rental);
      results.zillow = { success: true, data: result };
    } catch (error) {
      results.zillow = { success: false, error: (error as Error).message };
    }
  }

  if (platforms.includes('apartments.com')) {
    try {
      const result = await apartmentsComService.publishRentalToApartmentsCom(rental);
      results['apartments.com'] = { success: true, data: result };
    } catch (error) {
      results['apartments.com'] = { success: false, error: (error as Error).message };
    }
  }

  if (platforms.includes('craigslist')) {
    try {
      // Placeholder for Craigslist integration
      const result = await publishRentalToCraigslist(rental);
      results.craigslist = { success: true, data: result };
    } catch (error) {
      results.craigslist = { success: false, error: (error as Error).message };
    }
  }

  return results;
};

/**
 * @deprecated Use publishRentalToListingPlatforms instead
 * Publish listing to platforms (legacy method)
 */
export const publishToListingPlatforms = async (listing: any, platforms: string[]) => {
  console.warn('publishToListingPlatforms is deprecated. Use publishRentalToListingPlatforms instead.');
  
  // Try to find corresponding rental
  let rental: Rental | null = null;
  if (listing.rentalId) {
    rental = await prisma.rental.findUnique({ where: { id: listing.rentalId } });
  }

  if (rental) {
    return publishRentalToListingPlatforms(rental, platforms);
  }

  // Fallback to legacy behavior
  const results: any = {};

  if (platforms.includes('zillow')) {
    try {
      const result = await zillowService.publishToZillow(listing);
      results.zillow = { success: true, data: result };
    } catch (error) {
      results.zillow = { success: false, error: (error as Error).message };
    }
  }

  if (platforms.includes('apartments.com')) {
    try {
      const result = await apartmentsComService.publishToApartmentsCom(listing);
      results['apartments.com'] = { success: true, data: result };
    } catch (error) {
      results['apartments.com'] = { success: false, error: (error as Error).message };
    }
  }

  return results;
};

/**
 * Publish rental to multiple platforms by rental ID
 * @param rentalId The rental ID
 * @param platforms Array of platform names
 * @returns Results for each platform
 */
export const publishRentalById = async (rentalId: string, platforms: string[]) => {
  const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
  if (!rental) {
    throw new Error('Rental not found');
  }

  return publishRentalToListingPlatforms(rental, platforms);
};

/**
 * Get publishing status for a rental
 * @param rentalId The rental ID
 * @returns Publishing status across platforms
 */
export const getRentalPublishingStatus = async (rentalId: string) => {
  const rental = await prisma.rental.findUnique({ 
    where: { id: rentalId },
    include: {
      publishingHistory: true // Assuming this relation exists
    }
  });

  if (!rental) {
    throw new Error('Rental not found');
  }

  // Return publishing status (this would be more sophisticated in a real implementation)
  return {
    rentalId,
    platforms: {
      zillow: { published: false, lastPublished: null },
      'apartments.com': { published: false, lastPublished: null },
      craigslist: { published: false, lastPublished: null }
    },
    lastUpdated: rental.updatedAt
  };
};

/**
 * Placeholder for Craigslist publishing
 */
async function publishRentalToCraigslist(rental: Rental) {
  // This would integrate with Craigslist API or posting service
  console.log('Publishing rental to Craigslist:', rental.title);
  
  return {
    platform: 'craigslist',
    listingId: `cl_${rental.id}`,
    url: `https://craigslist.org/listing/${rental.id}`,
    publishedAt: new Date()
  };
}

/**
 * Bulk publish multiple rentals
 * @param rentalIds Array of rental IDs
 * @param platforms Array of platform names
 * @returns Results for each rental and platform
 */
export const bulkPublishRentals = async (rentalIds: string[], platforms: string[]) => {
  const results: Record<string, any> = {};

  for (const rentalId of rentalIds) {
    try {
      results[rentalId] = await publishRentalById(rentalId, platforms);
    } catch (error) {
      results[rentalId] = { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  return results;
};

/**
 * Schedule rental publishing
 * @param rentalId The rental ID
 * @param platforms Array of platform names
 * @param scheduledTime When to publish
 * @returns Scheduling confirmation
 */
export const scheduleRentalPublishing = async (
  rentalId: string, 
  platforms: string[], 
  scheduledTime: Date
) => {
  // This would integrate with a job queue system like Bull or Agenda
  console.log(`Scheduling rental ${rentalId} for publishing at ${scheduledTime}`);
  
  return {
    rentalId,
    platforms,
    scheduledTime,
    jobId: `job_${rentalId}_${Date.now()}`
  };
};
