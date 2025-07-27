import { predictiveAnalyticsService } from './predictiveAnalytics.service';
import { marketDataService } from './marketData.service';

class PricingService {
  async getPriceRecommendation(propertyData: any): Promise<any> {
    try {
      const address = propertyData.address || { city: '', state: '' };
      const location = `${address.city || ''}, ${address.state || ''}`.trim() || 'Unknown Location';
      
      // Try to get market data
      let marketData = {};
      try {
        // Temporarily using getComps as getMarketData is not available.
        // This might need further refinement based on actual data requirements.
        marketData = await marketDataService.getComps(propertyData.id);
      } catch (error) {
        console.warn('Market data service unavailable, using fallback data');
        marketData = this.getFallbackMarketData(propertyData);
      }

      const combinedData = { ...propertyData, ...marketData };
      
      // Try to get AI recommendation
      try {
        const recommendation = await predictiveAnalyticsService.getPriceRecommendation(combinedData);
        return {
          ...recommendation,
          priceRange: {
            min: Math.round(recommendation.recommendedPrice * 0.9),
            max: Math.round(recommendation.recommendedPrice * 1.1)
          },
          marketAnalysis: 'Based on AI analysis and market data',
          confidence: 'High'
        };
      } catch (error) {
        console.warn('AI pricing service unavailable, using fallback calculation');
        return this.getFallbackPricing(propertyData);
      }
    } catch (error) {
      console.error('Error in pricing recommendation:', error);
      return this.getFallbackPricing(propertyData);
    }
  }

  private getFallbackMarketData(propertyData: any) {
    const location = propertyData.address || {};
    return {
      avgRentPerSqFt: 1.5,
      medianRent: 1500,
      marketTrend: 'stable',
      occupancyRate: 0.95
    };
  }

  private getFallbackPricing(propertyData: any) {
    const bedrooms = parseInt(propertyData.bedrooms) || 2;
    const bathrooms = parseFloat(propertyData.bathrooms) || 1;
    const squareFeet = parseInt(propertyData.squareFeet) || 1000;
    const yearBuilt = parseInt(propertyData.yearBuilt) || 2000;
    
    // Simple calculation based on property features
    let basePrice = 1200; // Base price
    basePrice += bedrooms * 200; // Add $200 per bedroom
    basePrice += bathrooms * 100; // Add $100 per bathroom
    basePrice += (squareFeet - 800) * 0.5; // Add $0.50 per sqft over 800
    
    // Adjust for age
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;
    if (age > 20) basePrice *= 0.95; // 5% discount for older properties
    if (age < 5) basePrice *= 1.05; // 5% premium for newer properties
    
    // Adjust for amenities
    const amenities = propertyData.amenities || [];
    if (amenities.includes('pool')) basePrice += 100;
    if (amenities.includes('gym')) basePrice += 50;
    if (amenities.includes('parking')) basePrice += 75;
    if (amenities.includes('airConditioning')) basePrice += 50;

    const recommendedPrice = Math.round(basePrice);
    
    return {
      recommendedPrice,
      priceRange: {
        min: Math.round(recommendedPrice * 0.85),
        max: Math.round(recommendedPrice * 1.15)
      },
      marketAnalysis: 'Fallback pricing based on property specifications and local market averages',
      confidence: 'Medium'
    };
  }
}

export const pricingService = new PricingService();

export const getPricingRecommendation = (propertyFeatures: any) => {
  return pricingService.getPriceRecommendation(propertyFeatures);
};
