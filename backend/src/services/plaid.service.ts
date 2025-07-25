import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { config } from '../config/config';

class PlaidService {
  private client: PlaidApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[config.plaid.env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': config.plaid.clientId,
          'PLAID-SECRET': config.plaid.secret,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string) {
    const response = await this.client.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'PropertyAI',
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return response.data;
  }
}

export const plaidService = new PlaidService();