import { predictiveAnalyticsService } from './predictiveAnalytics.service';
import { marketDataService } from './marketData.service';

class PricingService {
  async getPriceRecommendation(propertyData: any): Promise<any> {
    const marketData = await marketDataService.getMarketData(propertyData.location);
    const combinedData = { ...propertyData, ...marketData };
    const recommendation = await predictiveAnalyticsService.getPriceRecommendation(combinedData);
    return recommendation;
  }
}

export const pricingService = new PricingService();
