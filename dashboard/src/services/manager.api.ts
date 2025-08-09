import axios from 'axios';

// Use the same API URL pattern as other services
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug logging to see what URL is being used
console.log('Manager API - Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Manager API - Using API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor to include auth token and log requests
api.interceptors.request.use((config) => {
  console.log('Manager API - Making request to:', config.baseURL + config.url);
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log('Manager API - Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Manager API - Request failed:', error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export const getQuotesForWorkOrder = (workOrderId: string) => {
  console.log('Manager API - Getting quotes for work order:', workOrderId);
  return api.get(`/manager/work-orders/${workOrderId}/quotes`);
};

export const approveQuote = (quoteId: string) => {
  console.log('Manager API - Approving quote:', quoteId);
  return api.post(`/manager/quotes/${quoteId}/approve`);
};

export const rejectQuote = (quoteId: string) => {
  console.log('Manager API - Rejecting quote:', quoteId);
  return api.post(`/manager/quotes/${quoteId}/reject`);
};