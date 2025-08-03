import { api } from './api';
import { Rental, CreateRentalDto, UpdateRentalDto, RentalFilterParams } from '../types/rental';

export class RentalService {
  private baseUrl = '/rentals';

  async getRentals(filters?: RentalFilterParams): Promise<Rental[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;
        
      const response = await api.get(url);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching rentals:', error);
      throw error;
    }
  }

  async getRentalById(id: string): Promise<Rental> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching rental:', error);
      throw error;
    }
  }

  async createRental(rentalData: CreateRentalDto): Promise<Rental> {
    try {
      const response = await api.post(this.baseUrl, rentalData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating rental:', error);
      throw error;
    }
  }

  async updateRental(id: string, rentalData: UpdateRentalDto): Promise<Rental> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, rentalData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating rental:', error);
      throw error;
    }
  }

  async deleteRental(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting rental:', error);
      throw error;
    }
  }

  async getRentalsByManager(managerId: string): Promise<Rental[]> {
    try {
      const response = await api.get(`${this.baseUrl}/manager/${managerId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching rentals by manager:', error);
      throw error;
    }
  }

  async getRentalsByOwner(ownerId: string): Promise<Rental[]> {
    try {
      const response = await api.get(`${this.baseUrl}/owner/${ownerId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching rentals by owner:', error);
      throw error;
    }
  }

  async setRentalAvailability(id: string, isAvailable: boolean, availableDate?: Date): Promise<Rental> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/availability`, {
        isAvailable,
        availableDate
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error setting rental availability:', error);
      throw error;
    }
  }

  async searchRentals(searchParams: any): Promise<Rental[]> {
    try {
      const response = await api.post(`${this.baseUrl}/search`, searchParams);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error searching rentals:', error);
      throw error;
    }
  }

  async getPublicRentals(searchQuery?: string): Promise<Rental[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (searchQuery) {
        // Add search parameters that the backend expects
        queryParams.append('search', searchQuery);
      }
      
      const url = queryParams.toString() 
        ? `${this.baseUrl}/public?${queryParams.toString()}`
        : `${this.baseUrl}/public`;
        
      const response = await api.get(url);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching public rentals:', error);
      throw error;
    }
  }
}

export const rentalService = new RentalService();