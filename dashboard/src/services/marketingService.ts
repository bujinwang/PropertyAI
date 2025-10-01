import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class MarketingService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/marketing`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Campaign Management
  async getCampaigns() {
    const response = await this.api.get('/campaigns');
    return response.data;
  }

  async getCampaign(id: string) {
    const response = await this.api.get(`/campaigns/${id}`);
    return response.data;
  }

  async createCampaign(data: {
    name: string;
    type: string;
    budget: number;
    startDate: string;
    endDate: string;
    description?: string;
    targetAudience?: any;
  }) {
    const response = await this.api.post('/campaigns', data);
    return response.data;
  }

  async updateCampaign(id: string, data: Partial<{
    name: string;
    type: string;
    budget: number;
    startDate: string;
    endDate: string;
    description: string;
    targetAudience: any;
    status: string;
  }>) {
    const response = await this.api.put(`/campaigns/${id}`, data);
    return response.data;
  }

  async deleteCampaign(id: string) {
    const response = await this.api.delete(`/campaigns/${id}`);
    return response.data;
  }

  async pauseCampaign(id: string) {
    const response = await this.api.post(`/campaigns/${id}/pause`);
    return response.data;
  }

  async resumeCampaign(id: string) {
    const response = await this.api.post(`/campaigns/${id}/resume`);
    return response.data;
  }

  // Promotion Management
  async getPromotions() {
    const response = await this.api.get('/promotions');
    return response.data;
  }

  async getPromotion(id: string) {
    const response = await this.api.get(`/promotions/${id}`);
    return response.data;
  }

  async createPromotion(data: {
    name: string;
    type: string;
    code: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    description?: string;
    usageLimit?: number;
    terms?: string;
    applicableProperties?: any;
  }) {
    const response = await this.api.post('/promotions', data);
    return response.data;
  }

  async updatePromotion(id: string, data: Partial<{
    name: string;
    type: string;
    code: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    description: string;
    usageLimit: number;
    terms: string;
    applicableProperties: any;
    status: string;
  }>) {
    const response = await this.api.put(`/promotions/${id}`, data);
    return response.data;
  }

  async deletePromotion(id: string) {
    const response = await this.api.delete(`/promotions/${id}`);
    return response.data;
  }

  async activatePromotion(id: string) {
    const response = await this.api.post(`/promotions/${id}/activate`);
    return response.data;
  }

  async deactivatePromotion(id: string) {
    const response = await this.api.post(`/promotions/${id}/deactivate`);
    return response.data;
  }

  async validatePromotionCode(code: string) {
    const response = await this.api.post('/promotions/validate-code', { code });
    return response.data;
  }

  // Analytics
  async getAnalyticsOverview(timeRange = '30d') {
    const response = await this.api.get('/analytics/overview', {
      params: { timeRange },
    });
    return response.data;
  }

  async getWebsiteTraffic(timeRange = '30d') {
    const response = await this.api.get('/analytics/traffic', {
      params: { timeRange },
    });
    return response.data;
  }

  async getLeadSources(timeRange = '30d') {
    const response = await this.api.get('/analytics/lead-sources', {
      params: { timeRange },
    });
    return response.data;
  }

  async getPropertyPerformance(timeRange = '30d') {
    const response = await this.api.get('/analytics/property-performance', {
      params: { timeRange },
    });
    return response.data;
  }

  async getConversionFunnel(timeRange = '30d') {
    const response = await this.api.get('/analytics/conversion-funnel', {
      params: { timeRange },
    });
    return response.data;
  }

  // Syndication
  async getSyndicationPlatforms() {
    const response = await this.api.get('/syndication/platforms');
    return response.data;
  }

  async updateSyndicationPlatform(id: string, data: {
    enabled?: boolean;
    apiKey?: string;
    apiSecret?: string;
    config?: any;
  }) {
    const response = await this.api.put(`/syndication/platforms/${id}`, data);
    return response.data;
  }

  async syncPlatform(id: string) {
    const response = await this.api.post(`/syndication/platforms/${id}/sync`);
    return response.data;
  }

  async syncAllPlatforms() {
    const response = await this.api.post('/syndication/sync-all');
    return response.data;
  }

  async getSyncActivity() {
    const response = await this.api.get('/syndication/activity');
    return response.data;
  }
}

export const marketingService = new MarketingService();
export default marketingService;
