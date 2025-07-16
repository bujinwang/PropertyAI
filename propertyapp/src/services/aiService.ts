import { api } from './api';
import { GenerateDescriptionResponse, PricingRecommendationResponse } from '../types/ai';

export const aiService = {
  generatePropertyDescription: async (propertyId: string, propertyData: {
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    amenities: string[];
    images: Array<{ uri: string; name: string; type: string }>;
  }) => {
    try {
      const response = await api.post<GenerateDescriptionResponse>(`/ai/properties/${propertyId}/generate-description`, {
        propertyType: propertyData.propertyType,
        bedrooms: parseInt(propertyData.bedrooms),
        bathrooms: parseFloat(propertyData.bathrooms),
        amenities: propertyData.amenities,
        imageUrls: propertyData.images.map(img => img.uri)
      });
      return response;
    } catch (error) {
      console.error('Error generating property description:', error);
      // Fallback to a simple description if AI service fails
      return {
        description: `${propertyData.bedrooms}-bedroom ${propertyData.propertyType} with ${propertyData.bathrooms} bathrooms. Features include ${propertyData.amenities.slice(0, 3).join(', ')}. Contact for more details.`
      };
    }
  },

  generatePricingRecommendations: async (propertyData: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    squareFeet: string;
    amenities?: string[];
    yearBuilt?: string;
  }) => {
    try {
      const response = await api.post<PricingRecommendationResponse>('/ai/pricing-recommendation', {
        address: propertyData.address,
        propertyType: propertyData.propertyType,
        bedrooms: parseInt(propertyData.bedrooms),
        bathrooms: parseFloat(propertyData.bathrooms),
        squareFeet: parseInt(propertyData.squareFeet),
        amenities: propertyData.amenities || [],
        yearBuilt: propertyData.yearBuilt ? parseInt(propertyData.yearBuilt) : undefined
      });
      return response;
    } catch (error) {
      console.error('Error generating pricing recommendations:', error);
      // Fallback to a simple recommendation if AI service fails
      const basePrice = 1500 + (parseInt(propertyData.bedrooms) * 300) + (parseInt(propertyData.squareFeet) / 100);
      return {
        recommendedPrice: Math.round(basePrice),
        priceRange: { min: Math.round(basePrice * 0.9), max: Math.round(basePrice * 1.1) },
        marketAnalysis: "Pricing estimate based on property specifications"
      };
    }
  }
};