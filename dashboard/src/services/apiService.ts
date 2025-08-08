import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  get: <T>(url: string, params?: object) => apiClient.get<T>(url, { params }).then(res => ({ data: res.data })).catch(err => ({ error: err.response?.data || err.message })),
  post: <T>(url: string, data: object) => apiClient.post<T>(url, data).then(res => ({ data: res.data })).catch(err => ({ error: err.response?.data || err.message })),
  put: <T>(url: string, data: object) => apiClient.put<T>(url, data).then(res => ({ data: res.data })).catch(err => ({ error: err.response?.data || err.message })),
  delete: <T>(url: string) => apiClient.delete<T>(url).then(res => ({ data: res.data })).catch(err => ({ error: err.response?.data || err.message })),
  
  // Photo analysis endpoint
  analyzePhoto: (maintenanceRequestId: string, imageUrl: string) => {
    return apiService.post('/maintenance/photo-analysis', {
      maintenanceRequestId,
      imageUrl,
    });
  },
};