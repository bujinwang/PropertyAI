import { zillowService } from './zillow.service';
import { truliaService } from './trulia.service';
import { realtorService } from './realtor.service';

class PublishingService {
  async publishListing(listingData: any) {
    const zillowResult = await zillowService.publish(listingData);
    const truliaResult = await truliaService.publish(listingData);
    const realtorResult = await realtorService.publish(listingData);

    return {
      zillow: zillowResult,
      trulia: truliaResult,
      realtor: realtorResult,
    };
  }
}

export const publishingService = new PublishingService();
