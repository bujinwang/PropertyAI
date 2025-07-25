import { zillowService } from './zillow.service';
import { getApartmentsComps } from './apartmentsComService';

class MarketDataService {
  async getComps(propertyId: string) {
    const zillowComps = await zillowService.getComps(propertyId);
    const apartmentsComps = await getApartmentsComps(propertyId);

    return {
      zillow: zillowComps,
      apartmentsCom: apartmentsComps,
    };
  }
}

export const marketDataService = new MarketDataService();
