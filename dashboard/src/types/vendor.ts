export interface Vendor {
  id: string;
  name: string;
  serviceCategory: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  address: string;
  performanceMetrics: {
    averageRating: number;
    completionRate: number;
    onTimePercentage: number;
  };
}

export interface VendorPerformanceRating {
  id: string;
  vendorId: string;
  workOrderId: string;
  metricId: string;
  rating: number;
  comments?: string;
  ratedById: string;
  createdAt: string;
  updatedAt: string;
}
