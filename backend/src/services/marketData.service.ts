import { zillowService } from './zillow.service';
import { getApartmentsComps } from './apartmentsComService';

class MarketDataService {
  async getComps(rentalId: string) {
    const zillowComps = await zillowService.getComps(rentalId);
    const apartmentsComps = await getApartmentsComps(rentalId);

    return {
      zillow: zillowComps,
      apartmentsCom: apartmentsComps,
    };
  }
}

export const marketDataService = new MarketDataService();
