import { Alert } from 'react-native';

export const fetchDocuments = async () => {
  try {
    const response = await fetch('/api/documents');
    if (!response.ok) {
      throw new Error('Failed to fetch documents.');
    }
    const json = await response.json();
    return json;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred.';
    Alert.alert('Error', message);
    throw error;
  }
};
