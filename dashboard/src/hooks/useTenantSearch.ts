import { useState, useCallback, useRef } from 'react';
import { TenantSearchResult } from '../types/enhancedTenantRating';
import { searchTenants } from '../services/enhancedTenantRating.api';
import { debounce } from '../utils/debounce';

interface UseTenantSearchReturn {
  searchResults: TenantSearchResult[];
  loading: boolean;
  error: string | null;
  searchTenants: (query: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

interface SearchCache {
  [query: string]: {
    results: TenantSearchResult[];
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MIN_SEARCH_LENGTH = 2;

export const useTenantSearch = (): UseTenantSearchReturn => {
  const [searchResults, setSearchResults] = useState<TenantSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for search results
  const cacheRef = useRef<SearchCache>({});
  
  // Keep track of the latest search query to handle race conditions
  const latestQueryRef = useRef<string>('');

  // Check if cached result is still valid
  const getCachedResult = useCallback((query: string): TenantSearchResult[] | null => {
    const cached = cacheRef.current[query];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.results;
    }
    return null;
  }, []);

  // Cache search results
  const setCachedResult = useCallback((query: string, results: TenantSearchResult[]) => {
    cacheRef.current[query] = {
      results,
      timestamp: Date.now()
    };
    
    // Clean up old cache entries (keep only last 20 searches)
    const entries = Object.entries(cacheRef.current);
    if (entries.length > 20) {
      const sortedEntries = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cacheRef.current = Object.fromEntries(sortedEntries.slice(0, 20));
    }
  }, []);

  // Perform the actual search
  const performSearch = useCallback(async (query: string) => {
    // Set this as the latest query
    latestQueryRef.current = query;
    
    try {
      setError(null);
      
      // Check if query is too short
      if (query.length < MIN_SEARCH_LENGTH) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      // Check cache first
      const cachedResults = getCachedResult(query);
      if (cachedResults) {
        // Only update if this is still the latest query
        if (latestQueryRef.current === query) {
          setSearchResults(cachedResults);
          setLoading(false);
        }
        return;
      }

      // Perform API search
      const response = await searchTenants(query);
      
      // Only update if this is still the latest query (handle race conditions)
      if (latestQueryRef.current === query) {
        setSearchResults(response.tenants);
        setCachedResult(query, response.tenants);
        setLoading(false);
      }
    } catch (err: any) {
      // Only update error if this is still the latest query
      if (latestQueryRef.current === query) {
        console.error('Error searching tenants:', err);
        setError(err.message || 'Failed to search tenants');
        setSearchResults([]);
        setLoading(false);
      }
    }
  }, [getCachedResult, setCachedResult]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(performSearch, 300),
    [performSearch]
  );

  // Main search function
  const search = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    
    // Clear results for empty queries
    if (!trimmedQuery) {
      setSearchResults([]);
      setError(null);
      setLoading(false);
      debouncedSearch.cancel();
      return;
    }

    // Set loading state immediately
    setLoading(true);
    setError(null);
    
    // Use debounced search for non-empty queries
    debouncedSearch(trimmedQuery);
  }, [debouncedSearch]);

  // Clear search results
  const clearResults = useCallback(() => {
    setSearchResults([]);
    setError(null);
    setLoading(false);
    debouncedSearch.cancel();
    latestQueryRef.current = '';
  }, [debouncedSearch]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchResults,
    loading,
    error,
    searchTenants: search,
    clearResults,
    clearError
  };
};