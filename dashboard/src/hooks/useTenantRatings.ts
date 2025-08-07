import { useState, useEffect, useCallback } from 'react';
import {
  EnhancedTenantRating,
  CreateEnhancedRatingRequest,
  UpdateEnhancedRatingRequest,
  RatingAnalytics
} from '../types/enhancedTenantRating';
import {
  getEnhancedTenantRatings,
  createEnhancedTenantRating,
  updateEnhancedTenantRating,
  deleteEnhancedTenantRating,
  getTenantRatingAnalytics
} from '../services/enhancedTenantRating.api';

interface UseTenantRatingsReturn {
  ratings: EnhancedTenantRating[];
  analytics: RatingAnalytics | null;
  loading: boolean;
  error: string | null;
  createRating: (rating: CreateEnhancedRatingRequest) => Promise<void>;
  updateRating: (id: string, rating: UpdateEnhancedRatingRequest) => Promise<void>;
  deleteRating: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useTenantRatings = (tenantId: string | null): UseTenantRatingsReturn => {
  const [ratings, setRatings] = useState<EnhancedTenantRating[]>([]);
  const [analytics, setAnalytics] = useState<RatingAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ratings and analytics for a tenant
  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching tenant ratings for tenantId:', id);

      const [ratingsResponse, analyticsResponse] = await Promise.all([
        getEnhancedTenantRatings(id),
        getTenantRatingAnalytics(id)
      ]);

      console.log('📊 Raw ratings response:', ratingsResponse);
      console.log('📈 Analytics response:', analyticsResponse);

      // Check if ratings have rater information
      if (ratingsResponse && ratingsResponse.length > 0) {
        ratingsResponse.forEach((rating, index) => {
          console.log(`📝 Rating ${index}:`, {
            id: rating.id,
            hasRater: !!rating.rater,
            rater: rating.rater,
            raterId: rating.raterId
          });
        });
      }

      setRatings(ratingsResponse);
      setAnalytics(analyticsResponse.analytics);
    } catch (err: any) {
      console.error('❌ Error fetching tenant ratings:', err);
      setError(err.message || 'Failed to fetch tenant ratings');
      setRatings([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to fetch data when tenantId changes
  useEffect(() => {
    if (tenantId) {
      fetchData(tenantId);
    } else {
      setRatings([]);
      setAnalytics(null);
      setError(null);
    }
  }, [tenantId, fetchData]);

  // Create a new rating
  const createRating = useCallback(async (ratingData: CreateEnhancedRatingRequest) => {
    try {
      setError(null);
      const newRating = await createEnhancedTenantRating(ratingData);
      
      // Optimistic update - add the new rating to the list
      setRatings(prev => [newRating, ...prev]);
      
      // Refetch analytics to get updated data
      if (tenantId) {
        try {
          const analyticsResponse = await getTenantRatingAnalytics(tenantId);
          setAnalytics(analyticsResponse.analytics);
        } catch (analyticsError) {
          console.warn('Failed to update analytics after creating rating:', analyticsError);
        }
      }
    } catch (err: any) {
      console.error('Error creating tenant rating:', err);
      setError(err.message || 'Failed to create rating');
      throw err; // Re-throw to allow form to handle the error
    }
  }, [tenantId]);

  // Update an existing rating
  const updateRating = useCallback(async (id: string, ratingData: UpdateEnhancedRatingRequest) => {
    try {
      setError(null);
      const updatedRating = await updateEnhancedTenantRating(id, ratingData);
      
      // Optimistic update - replace the updated rating in the list
      setRatings(prev => prev.map(rating => 
        rating.id === id ? updatedRating : rating
      ));
      
      // Refetch analytics to get updated data
      if (tenantId) {
        try {
          const analyticsResponse = await getTenantRatingAnalytics(tenantId);
          setAnalytics(analyticsResponse.analytics);
        } catch (analyticsError) {
          console.warn('Failed to update analytics after updating rating:', analyticsError);
        }
      }
    } catch (err: any) {
      console.error('Error updating tenant rating:', err);
      setError(err.message || 'Failed to update rating');
      throw err;
    }
  }, [tenantId]);

  // Delete a rating
  const deleteRating = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteEnhancedTenantRating(id);
      
      // Optimistic update - remove the rating from the list
      setRatings(prev => prev.filter(rating => rating.id !== id));
      
      // Refetch analytics to get updated data
      if (tenantId) {
        try {
          const analyticsResponse = await getTenantRatingAnalytics(tenantId);
          setAnalytics(analyticsResponse.analytics);
        } catch (analyticsError) {
          console.warn('Failed to update analytics after deleting rating:', analyticsError);
        }
      }
    } catch (err: any) {
      console.error('Error deleting tenant rating:', err);
      setError(err.message || 'Failed to delete rating');
      throw err;
    }
  }, [tenantId]);

  // Refetch data manually
  const refetch = useCallback(async () => {
    if (tenantId) {
      await fetchData(tenantId);
    }
  }, [tenantId, fetchData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ratings,
    analytics,
    loading,
    error,
    createRating,
    updateRating,
    deleteRating,
    refetch,
    clearError
  };
};