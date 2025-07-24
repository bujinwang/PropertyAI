export interface TenantRating {
  id: string;
  leaseId: string;
  tenantId: string;
  raterId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  rater: {
    firstName: string;
    lastName: string;
  };
}
