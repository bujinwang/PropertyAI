export interface EnhancedTenantRating {
  id: string;
  leaseId: string;
  tenantId: string;
  raterId: string;
  categories: {
    cleanliness: number;
    communication: number;
    paymentHistory: number;
    propertyCare: number;
  };
  overallRating: number;
  comment?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  rater: {
    firstName: string;
    lastName: string;
  };
}

export interface TenantSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  property: {
    address: string;
    unit: string;
  };
  currentLease?: {
    id: string;
    startDate: string;
    endDate: string;
  };
}

export interface RatingAnalytics {
  averageRatings: {
    overall: number;
    cleanliness: number;
    communication: number;
    paymentHistory: number;
    propertyCare: number;
  };
  ratingDistribution: {
    [key: number]: number;
  };
  trendData: {
    date: string;
    rating: number;
  }[];
  totalRatings: number;
  lastUpdated: string;
}

export interface CreateEnhancedRatingRequest {
  tenantId: string;
  leaseId: string;
  categories: {
    cleanliness: number;
    communication: number;
    paymentHistory: number;
    propertyCare: number;
  };
  comment?: string;
  tags?: string[];
  attachments?: string[];
}

export interface UpdateEnhancedRatingRequest extends Partial<CreateEnhancedRatingRequest> {
  id: string;
}

export interface TenantSearchResponse {
  tenants: TenantSearchResult[];
  total: number;
}

export interface RatingAnalyticsResponse {
  analytics: RatingAnalytics;
  lastUpdated: string;
}

export const RATING_CATEGORIES = {
  cleanliness: 'Cleanliness',
  communication: 'Communication',
  paymentHistory: 'Payment History',
  propertyCare: 'Property Care'
} as const;

export type RatingCategory = keyof typeof RATING_CATEGORIES;