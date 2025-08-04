import axios from 'axios';
import { Application, Document, Property } from '../types/tenant-screening';
import { useAuth } from '../contexts/AuthContext';

// Get the base URL from environment variables
const baseURL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Tenant Screening API endpoints
export const tenantScreeningApi = {
  // Applications
  getApplications: async (filters?: Record<string, any>): Promise<Application[]> => {
    const response = await api.get('/applications', { params: filters });
    return response.data;
  },
  
  getApplication: async (id: string): Promise<Application> => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },
  
  createApplication: async (application: Partial<Application>): Promise<Application> => {
    const response = await api.post('/applications', application);
    return response.data;
  },
  
  updateApplication: async (id: string, application: Partial<Application>): Promise<Application> => {
    const response = await api.put(`/applications/${id}`, application);
    return response.data;
  },
  
  updateApplicationStatus: async (id: string, status: Application['status'], notes?: string): Promise<Application> => {
    const response = await api.patch(`/applications/${id}/status`, { status, notes });
    return response.data;
  },
  
  requestAdditionalInfo: async (id: string, requestedFields: string[]): Promise<Application> => {
    const response = await api.post(`/applications/${id}/request-info`, { requestedFields });
    return response.data;
  },
  
  // Document handling
  uploadDocument: async (applicationId: string, file: File, documentType: string): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    const response = await api.post(`/applications/${applicationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  deleteDocument: async (applicationId: string, documentId: string): Promise<void> => {
    await api.delete(`/applications/${applicationId}/documents/${documentId}`);
  },
  
  // Properties
  getProperties: async (): Promise<Property[]> => {
    const response = await api.get('/properties');
    return response.data;
  },
  
  getProperty: async (id: string): Promise<Property> => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },
  
  // Screening
  initiateScreening: async (applicationId: string): Promise<Application> => {
    const response = await api.post(`/applications/${applicationId}/screen`);
    return response.data;
  },
  
  getScreeningResults: async (applicationId: string): Promise<Application['screeningResults']> => {
    const response = await api.get(`/applications/${applicationId}/screening-results`);
    return response.data;
  },
};

export default api;