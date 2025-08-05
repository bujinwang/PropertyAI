const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

export interface Campaign {
  id: string;
  name: string;
  type: 'google_ads' | 'facebook' | 'zillow' | 'apartments_com';
  status: 'active' | 'paused' | 'draft' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  startDate: string;
  endDate: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'free_month' | 'waived_fee' | 'gift_card';
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  description: string;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  code: string;
}

export interface SyndicationPlatform {
  id: string;
  name: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  totalListings: number;
  activeListings: number;
  monthlyFee: number;
}

// Campaign API calls
export const marketingService = {
  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const response = await fetch(`${API_BASE_URL}/marketing/campaigns`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }
    
    const data = await response.json();
    return data.data;
  },

  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    const response = await fetch(`${API_BASE_URL}/marketing/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create campaign');
    }
    
    const data = await response.json();
    return data.data;
  },

  async updateCampaign(id: string, campaignData: Partial<Campaign>): Promise<Campaign> {
    const response = await fetch(`${API_BASE_URL}/marketing/campaigns/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update campaign');
    }
    
    const data = await response.json();
    return data.data;
  },

  async deleteCampaign(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/marketing/campaigns/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete campaign');
    }
  },

  // Analytics
  async getAnalyticsOverview(timeRange: string = '30d') {
    const response = await fetch(`${API_BASE_URL}/marketing/analytics/overview?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics overview');
    }
    
    const data = await response.json();
    return data.data;
  },

  async getWebsiteTraffic(timeRange: string = '30d') {
    const response = await fetch(`${API_BASE_URL}/marketing/analytics/traffic?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch website traffic');
    }
    
    const data = await response.json();
    return data.data;
  },

  async getLeadSources(timeRange: string = '30d') {
    const response = await fetch(`${API_BASE_URL}/marketing/analytics/lead-sources?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch lead sources');
    }
    
    const data = await response.json();
    return data.data;
  },

  async getPropertyPerformance(timeRange: string = '30d') {
    const response = await fetch(`${API_BASE_URL}/marketing/analytics/property-performance?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch property performance');
    }
    
    const data = await response.json();
    return data.data;
  },

  async getConversionFunnel(timeRange: string = '30d') {
    const response = await fetch(`${API_BASE_URL}/marketing/analytics/conversion-funnel?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversion funnel');
    }
    
    const data = await response.json();
    return data.data;
  },

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    const response = await fetch(`${API_BASE_URL}/marketing/promotions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch promotions');
    }
    
    const data = await response.json();
    return data.data;
  },

  async createPromotion(promotionData: Partial<Promotion>): Promise<Promotion> {
    const response = await fetch(`${API_BASE_URL}/marketing/promotions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promotionData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create promotion');
    }
    
    const data = await response.json();
    return data.data;
  },

  async updatePromotion(id: string, promotionData: Partial<Promotion>): Promise<Promotion> {
    const response = await fetch(`${API_BASE_URL}/marketing/promotions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promotionData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update promotion');
    }
    
    const data = await response.json();
    return data.data;
  },

  async deletePromotion(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/marketing/promotions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete promotion');
    }
  },

  async validatePromotionCode(code: string) {
    const response = await fetch(`${API_BASE_URL}/marketing/promotions/validate-code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate promotion code');
    }
    
    const data = await response.json();
    return data.data;
  },

  // Syndication
  async getSyndicationPlatforms(): Promise<SyndicationPlatform[]> {
    const response = await fetch(`${API_BASE_URL}/marketing/syndication/platforms`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch syndication platforms');
    }
    
    const data = await response.json();
    return data.data;
  },

  async updateSyndicationPlatform(id: string, platformData: Partial<SyndicationPlatform>): Promise<SyndicationPlatform> {
    const response = await fetch(`${API_BASE_URL}/marketing/syndication/platforms/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(platformData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update syndication platform');
    }
    
    const data = await response.json();
    return data.data;
  },

  async syncPlatform(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/marketing/syndication/platforms/${id}/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync platform');
    }
  },

  async syncAllPlatforms(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/marketing/syndication/sync-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync all platforms');
    }
  },

  async getSyncActivity() {
    const response = await fetch(`${API_BASE_URL}/marketing/syndication/activity`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sync activity');
    }
    
    const data = await response.json();
    return data.data;
  }
};