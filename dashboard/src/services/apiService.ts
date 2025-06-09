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
