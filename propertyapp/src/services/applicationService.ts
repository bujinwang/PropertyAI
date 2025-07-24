import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Replace with your actual API URL

export interface ApplicationData {
  listingId: string;
  applicantId: string;
  screening: {
    creditScore: number;
    income: number;
    employmentStatus: string;
    rentalHistory: string;
    criminalHistory: string;
  };
}

export const submitApplication = async (data: ApplicationData) => {
  try {
    const response = await axios.post(`${API_URL}/applications`, data);
    return response.data;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
};