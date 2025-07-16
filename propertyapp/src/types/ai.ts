export interface GenerateDescriptionResponse {
  description: string;
}

export interface PricingRecommendationResponse {
  recommendedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketAnalysis: string;
}