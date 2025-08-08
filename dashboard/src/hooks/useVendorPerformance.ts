import { useQuery } from '@tanstack/react-query';
import { vendorPerformanceApi } from '../services/vendorPerformanceApi';

export const useVendorPerformance = (vendorId: string) => {
  const { data: ratings, isLoading: ratingsLoading, error: ratingsError } = useQuery({
    queryKey: ['vendorRatings', vendorId],
    queryFn: () => vendorPerformanceApi.getRatingsForVendor(vendorId),
    enabled: !!vendorId,
  });

  const { data: averageScore, isLoading: averageScoreLoading, error: averageScoreError } = useQuery({
    queryKey: ['vendorAverageScore', vendorId],
    queryFn: () => vendorPerformanceApi.getAverageScoreForVendor(vendorId),
    enabled: !!vendorId,
  });

  return {
    ratings,
    ratingsLoading,
    ratingsError,
    averageScore,
    averageScoreLoading,
    averageScoreError,
  };
};
