import { predictiveAnalyticsService } from './predictiveAnalytics.service';
import { marketDataService } from './marketData.service';

class PricingService {
  async getPriceRecommendation(propertyData: any): Promise<any> {
    const address = propertyData.address || { city: '', state: '' };
    const location = `${address.city || ''}, ${address.state || ''}`.trim() || 'Unknown Location';
    const marketData = await marketDataService.getMarketData(location);
    const combinedData = { ...propertyData, ...marketData };
    const recommendation = await predictiveAnalyticsService.getPriceRecommendation(combinedData);
    return recommendation;
  }
}

export const pricingService = new PricingService();

export const getPricingRecommendation = (propertyFeatures: any) => {
  return pricingService.getPriceRecommendation(propertyFeatures);
};
