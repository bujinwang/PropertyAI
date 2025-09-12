
import { Visitor, Delivery } from '../types/visitor';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface VisitorResponse {
  visitors: Visitor[];
}

export interface DeliveryResponse {
  deliveries: Delivery[];
}

export interface CreateVisitorRequest {
  name: string;
  email?: string;
  phone?: string;
  visitDate: string;
  visitTime?: string;
  purpose: string;
  notes?: string;
}

export interface CreateDeliveryRequest {
  trackingNumber: string;
  carrier: string;
  sender: string;
  description: string;
  recipientName?: string;
  recipientPhone?: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await this.getAuthToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async getAuthToken(): Promise<string | null> {
    // This would typically come from your auth context/storage
    // For now, return null or implement your auth logic
    return null;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

export const visitorService = {
  /**
   * Get all visitors for the current user's rental
   */
  async getVisitors(): Promise<Visitor[]> {
    try {
      const response = await apiClient.get<VisitorResponse>('/visitors');
      return response.visitors;
    } catch (error) {
      console.error('Error fetching visitors:', error);
      // Return mock data for now until backend is ready
      return [
        {
          id: '1',
          name: 'John Smith',
          phone: '+1 (555) 123-4567',
          visitDate: '2024-01-20',
          visitTime: '14:00',
          purpose: 'Package Delivery',
          status: 'APPROVED',
          accessCode: 'A1B2C3',
          notes: 'Delivering Amazon package',
          requestedById: 'user1',
          rentalId: 'rental1',
          createdAt: '2024-01-19T10:00:00Z',
          updatedAt: '2024-01-19T10:00:00Z',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '+1 (555) 987-6543',
          visitDate: '2024-01-22',
          visitTime: '10:00',
          purpose: 'Maintenance Visit',
          status: 'PENDING',
          notes: 'HVAC repair technician',
          requestedById: 'user1',
          rentalId: 'rental1',
          createdAt: '2024-01-21T09:00:00Z',
          updatedAt: '2024-01-21T09:00:00Z',
        },
      ];
    }
  },

  /**
   * Get a specific visitor by ID
   */
  async getVisitorById(visitorId: string): Promise<Visitor> {
    try {
      const response = await apiClient.get<{ visitor: Visitor }>(`/visitors/${visitorId}`);
      return response.visitor;
    } catch (error) {
      console.error('Error fetching visitor:', error);
      throw new Error('Failed to fetch visitor');
    }
  },

  /**
   * Create a new visitor request
   */
  async createVisitor(visitorData: CreateVisitorRequest): Promise<Visitor> {
    try {
      const response = await apiClient.post<{ visitor: Visitor }>('/visitors', visitorData);
      return response.visitor;
    } catch (error) {
      console.error('Error creating visitor:', error);
      throw new Error('Failed to create visitor');
    }
  },

  /**
   * Approve a visitor request
   */
  async approveVisitor(visitorId: string): Promise<Visitor> {
    try {
      const response = await apiClient.put<{ visitor: Visitor }>(`/visitors/${visitorId}/approve`);
      return response.visitor;
    } catch (error) {
      console.error('Error approving visitor:', error);
      throw new Error('Failed to approve visitor');
    }
  },

  /**
   * Deny a visitor request
   */
  async denyVisitor(visitorId: string): Promise<Visitor> {
    try {
      const response = await apiClient.put<{ visitor: Visitor }>(`/visitors/${visitorId}/deny`);
      return response.visitor;
    } catch (error) {
      console.error('Error denying visitor:', error);
      throw new Error('Failed to deny visitor');
    }
  },

  /**
   * Get all deliveries for the current user's rental
   */
  async getDeliveries(): Promise<Delivery[]> {
    try {
      const response = await apiClient.get<DeliveryResponse>('/deliveries');
      return response.deliveries;
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      // Return mock data for now until backend is ready
      return [
        {
          id: '1',
          trackingNumber: '1Z999AA1234567890',
          carrier: 'UPS',
          sender: 'Amazon',
          description: 'Wireless Headphones',
          status: 'DELIVERED',
          deliveryDate: '2024-01-19T14:30:00Z',
          pickupCode: 'P12345',
          location: 'Front Desk',
          rentalId: 'rental1',
          createdAt: '2024-01-18T10:00:00Z',
          updatedAt: '2024-01-19T14:30:00Z',
        },
        {
          id: '2',
          trackingNumber: '9400111899223344556677',
          carrier: 'USPS',
          sender: 'Best Buy',
          description: 'Laptop Stand',
          status: 'IN_TRANSIT',
          location: 'In Transit',
          rentalId: 'rental1',
          createdAt: '2024-01-20T08:00:00Z',
          updatedAt: '2024-01-20T08:00:00Z',
        },
      ];
    }
  },

  /**
   * Mark a delivery as picked up
   */
  async markDeliveryAsPickedUp(deliveryId: string): Promise<Delivery> {
    try {
      const response = await apiClient.put<{ delivery: Delivery }>(`/deliveries/${deliveryId}/pickup`);
      return response.delivery;
    } catch (error) {
      console.error('Error marking delivery as picked up:', error);
      throw new Error('Failed to mark delivery as picked up');
    }
  },
};

export default visitorService;