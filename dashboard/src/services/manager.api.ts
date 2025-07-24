import axios from 'axios';

// This would typically be in a shared config file
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  // Assume a token is handled by an interceptor, similar to the contractor app
});

export const getQuotesForWorkOrder = (workOrderId: string) => {
  return api.get(`/manager/work-orders/${workOrderId}/quotes`);
};

export const approveQuote = (quoteId: string) => {
  return api.post(`/manager/quotes/${quoteId}/approve`);
};

export const rejectQuote = (quoteId: string) => {
  return api.post(`/manager/quotes/${quoteId}/reject`);
};