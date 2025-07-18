export interface GenerateDescriptionResponse {
  description: string;
  aiGeneratedDescription?: string;
}

export interface PricingRecommendationResponse {
  recommendedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketAnalysis: string;
  confidence?: string;
}