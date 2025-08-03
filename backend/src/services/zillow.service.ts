import axios from 'axios';
import { config } from '../config/config';

class ZillowService {
  private apiKey: string;

  constructor() {
    if (!config.zillow.apiKey) {
      throw new Error('Zillow API key is not defined');
    }
    this.apiKey = config.zillow.apiKey;
  }

  async getComps(rentalId: string): Promise<any> {
    const url = `https://api.zillow.com/v1/property/${rentalId}/comps`;
    const response = await axios.get(url, {
      params: {
        'zws-id': this.apiKey,
        count: 5,
      },
    });
    return response.data;
  }

  async publish(listingData: any): Promise<any> {
    console.log('Publishing to Zillow:', listingData);
    return { success: true, message: 'Published to Zillow' };
  }
}

export const zillowService = new ZillowService();
