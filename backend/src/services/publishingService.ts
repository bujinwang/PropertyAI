import { Listing } from '@prisma/client';
import * as zillowService from './zillowService';
import * as apartmentsComService from './apartmentsComService';

export const publishToListingPlatforms = async (listing: Listing, platforms: string[]) => {
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
