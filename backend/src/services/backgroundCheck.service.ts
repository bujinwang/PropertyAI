import { config } from '../config/config';
import { AppError } from '../middleware/errorMiddleware';
import axios from 'axios';

class BackgroundCheckService {
  private transunionApiKey: string;
  private experianApiKey: string;

  constructor() {
    if (!config.transunion.apiKey || !config.experian.apiKey) {
      throw new Error('Background check API key is not defined');
    }
    this.transunionApiKey = config.transunion.apiKey;
    this.experianApiKey = config.experian.apiKey;
  }

  async runTransunionCheck(applicantId: string): Promise<any> {
    const url = `https://api.transunion.com/v1/background-check`;
    const response = await axios.post(url, {
      apiKey: this.transunionApiKey,
      applicantId,
    });
    return response.data;
  }

  async runExperianCheck(applicantId: string): Promise<any> {
    const url = `https://api.experian.com/v1/background-check`;
    const response = await axios.post(url, {
      apiKey: this.experianApiKey,
      applicantId,
    });
    return response.data;
  }
}

export const backgroundCheckService = new BackgroundCheckService();
