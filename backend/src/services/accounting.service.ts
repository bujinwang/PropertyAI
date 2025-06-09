import ApiService from './api.service';

class AccountingService {
  private quickBooksApi: ApiService;
  private xeroApi: ApiService;

  constructor() {
    this.quickBooksApi = new ApiService('https://sandbox-quickbooks.api.intuit.com', process.env.QUICKBOOKS_API_KEY!);
    this.xeroApi = new ApiService('https://api.xero.com', process.env.XERO_API_KEY!);
  }

  public async syncToQuickBooks(data: any) {
    try {
      const response = await this.quickBooksApi.post('/v3/company/123146428700338/invoice', data);
      return response;
    } catch (error) {
      console.error('Error syncing to QuickBooks:', error);
      throw error;
    }
  }

  public async syncToXero(data: any) {
    try {
      const response = await this.xeroApi.post('/api.xro/2.0/Invoices', data);
      return response;
    } catch (error) {
      console.error('Error syncing to Xero:', error);
      throw error;
    }
  }
}

export const accountingService = new AccountingService();
