import axios from 'axios';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 100; // 100ms between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

let requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Queued request failed:', error);
      }
      // Add delay between requests to prevent rate limiting
      if (requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }
  }
  
  isProcessingQueue = false;
};

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Enhanced error handling with retry logic
const makeRequestWithRetry = async <T>(
  requestFn: () => Promise<any>,
  retries = MAX_RETRIES
): Promise<{ data?: T; error?: any }> => {
  try {
    const response = await requestFn();
    return { data: response.data };
  } catch (error: any) {
    if (error.response?.status === 429 && retries > 0) {
      // Rate limited - wait and retry
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
      console.warn(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequestWithRetry(requestFn, retries - 1);
    }
    
    return { 
      error: {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
};

export const apiService = {
  get: <T>(url: string, params?: object) => 
    makeRequestWithRetry<T>(() => apiClient.get<T>(url, { params })),
    
  post: <T>(url: string, data: object) => 
    makeRequestWithRetry<T>(() => apiClient.post<T>(url, data)),
    
  put: <T>(url: string, data: object) => 
    makeRequestWithRetry<T>(() => apiClient.put<T>(url, data)),
    
  delete: <T>(url: string) => 
    makeRequestWithRetry<T>(() => apiClient.delete<T>(url)),
  
  // Photo analysis endpoint
  analyzePhoto: (maintenanceRequestId: string, imageUrl: string) => {
    return apiService.post('/maintenance/photo-analysis', {
      maintenanceRequestId,
      imageUrl,
    });
  },

  // Maintenance quotes endpoints
  generateQuotes: (analysisData: any) => {
    return apiService.post('/maintenance/generate-quotes', analysisData);
  },

  getQuotes: (maintenanceRequestId: string) => {
    return apiService.get(`/maintenance/${maintenanceRequestId}/quotes`);
  },

  updateQuoteStatus: (quoteId: string, status: 'approved' | 'rejected') => {
    return apiService.put(`/maintenance/quotes/${quoteId}`, { status });
  },

  // Batch request method to handle multiple API calls with rate limiting
  batchRequests: async <T>(requests: Array<() => Promise<{ data?: T; error?: any }>>) => {
    const results: Array<{ data?: T; error?: any }> = [];
    
    for (const request of requests) {
      const result = await request();
      results.push(result);
      
      // Add delay between batch requests
      if (requests.indexOf(request) < requests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }
    
    return results;
  }
};