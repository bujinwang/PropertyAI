import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Unit {
  id: number;
  name: string;
  status: string;
  type: string;
  rent: number;
  address: string;
  description: string;
  amenities: string[];
}

export const getUnits = async (): Promise<Unit[]> => {
  const response = await axios.get(`${API_URL}/units`);
  return response.data as Unit[];
};

export const getUnit = async (id: string): Promise<Unit> => {
  const response = await axios.get(`${API_URL}/units/${id}`);
  return response.data as Unit;
};

export const createUnit = async (unit: any) => {
  const response = await axios.post(`${API_URL}/units`, unit);
  return response.data;
};

export const updateUnit = async (id: string, unit: any) => {
  const response = await axios.put(`${API_URL}/units/${id}`, unit);
  return response.data;
};

export const deleteUnit = async (id: string) => {
  const response = await axios.delete(`${API_URL}/units/${id}`);
  return response.data;
};
