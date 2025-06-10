import axios from 'axios';
import { Message } from '../types/types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const analyzeSentiment = async (message: string) => {
  try {
    const response = await axios.post(`${API_URL}/sentiment/analyze`, { message });
    return response.data;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
};

export const getMessages = async (conversationId: number): Promise<Message[]> => {
  try {
    const response = await axios.get<Message[]>(`${API_URL}/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const analyzePhoto = async (maintenanceRequestId: string, imageUrl: string) => {
  try {
    const response = await axios.post(`${API_URL}/photo-analysis/maintenance-requests/${maintenanceRequestId}/analyze-photo`, { imageUrl });
    return response.data;
  } catch (error) {
    console.error('Error analyzing photo:', error);
    throw error;
  }
};

export const createPaymentIntent = async (leaseId: string) => {
  try {
    const response = await axios.post<{ clientSecret: string }>(`${API_URL}/payments/create-payment-intent`, { leaseId });
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};
