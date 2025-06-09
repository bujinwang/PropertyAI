import axios from 'axios';

class ApiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  public async get(endpoint: string, params?: any) {
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      throw error;
    }
  }

  public async post(endpoint: string, data: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/${endpoint}`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error posting data to ${endpoint}:`, error);
      throw error;
    }
  }
}

export default ApiService;
