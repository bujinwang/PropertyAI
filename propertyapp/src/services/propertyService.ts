import { api } from './api';
import { Property } from '../types/property'; // Import Property type

interface PricingRequest {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
}

interface PricingResponse {
  recommendedPrice: number;
}

const getPricingRecommendation = (data: PricingRequest): Promise<PricingResponse> => {
  return api.post('/pricing/recommend-price', data);
};

const getProperties = async (): Promise<Property[]> => {
  const response = await api.get<Property[]>('/listings'); // Explicitly type the response data
  return response; // Return response directly, assuming it's the array
};

export const propertyService = {
  getPricingRecommendation,
  getProperties, // Add the new function
};
