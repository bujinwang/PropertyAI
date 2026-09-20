import axios from 'axios';
import { config } from '../config/config';

class ZillowService {
  private apiKey: string | null = null;

  /**
   * Resolve the key lazily, on first use.
   *
   * The check used to live in the constructor, and this module instantiates the
   * service at import time (`export const zillowService = new ZillowService()`),
   * so a missing ZILLOW_API_KEY made *importing the module* throw — silently
   * stopping every suite that reaches it from running at all in CI, where
   * `.env.example` carries no keys. Same pattern as generativeAI.service.ts
   * and nlp.service.ts.
   */
  private ensureKey(): void {
    if (!this.apiKey) {
      if (!config.zillow.apiKey) {
        throw new Error('Zillow API key is not defined');
      }
      this.apiKey = config.zillow.apiKey;
    }
  }

  async getComps(rentalId: string): Promise<any> {
    this.ensureKey();
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
