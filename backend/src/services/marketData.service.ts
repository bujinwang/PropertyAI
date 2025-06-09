import axios from 'axios';

class MarketDataService {
  async getMarketData(location: string): Promise<any> {
    // This is a mock implementation.
    // In a real implementation, this would fetch data from a real estate market data API.
    console.log('Fetching market data for:', location);
    return {
      averageRent: 2000,
      averageSalePrice: 500000,
      daysOnMarket: 30,
    };
  }
}

export const marketDataService = new MarketDataService();
