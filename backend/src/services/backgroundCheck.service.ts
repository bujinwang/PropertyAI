import { config } from '../config/config';
import { AppError } from '../middleware/errorMiddleware';

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
    // Mock implementation
    console.log(`Running TransUnion check for applicant ${applicantId}`);
    return {
      status: 'completed',
      summary: 'No criminal records found.',
    };
  }

  async runExperianCheck(applicantId: string): Promise<any> {
    // Mock implementation
    console.log(`Running Experian check for applicant ${applicantId}`);
    return {
      status: 'completed',
      summary: 'Credit score: 750',
    };
  }
}

export const backgroundCheckService = new BackgroundCheckService();
