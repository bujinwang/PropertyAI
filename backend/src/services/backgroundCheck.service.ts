import { config } from '../config/config';
import { AppError } from '../middleware/errorMiddleware';
import axios from 'axios';

class BackgroundCheckService {
  private transunionApiKey: string | null = null;
  private experianApiKey: string | null = null;

  /**
   * Resolve the keys lazily, on first use.
   *
   * The check used to live in the constructor, and this module instantiates the
   * service at import time (`export const backgroundCheckService = new
   * BackgroundCheckService()`), so missing TRANSUNION_API_KEY / EXPERIAN_API_KEY
   * made *importing the module* throw — silently stopping every suite that
   * reaches it from running at all in CI, where `.env.example` carries no keys.
   * Same pattern as generativeAI.service.ts and nlp.service.ts.
   */
  private ensureKeys(): void {
    if (!this.transunionApiKey || !this.experianApiKey) {
      if (!config.transunion.apiKey || !config.experian.apiKey) {
        throw new Error('Background check API key is not defined');
      }
      this.transunionApiKey = config.transunion.apiKey;
      this.experianApiKey = config.experian.apiKey;
    }
  }

  async runTransunionCheck(applicantId: string): Promise<any> {
    this.ensureKeys();
    const url = `https://api.transunion.com/v1/background-check`;
    const response = await axios.post(url, {
      apiKey: this.transunionApiKey,
      applicantId,
    });
    return response.data;
  }

  async runExperianCheck(applicantId: string): Promise<any> {
    this.ensureKeys();
    const url = `https://api.experian.com/v1/background-check`;
    const response = await axios.post(url, {
      apiKey: this.experianApiKey,
      applicantId,
    });
    return response.data;
  }
}

export const backgroundCheckService = new BackgroundCheckService();
