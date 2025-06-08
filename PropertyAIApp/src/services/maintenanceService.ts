import { Alert } from 'react-native';

interface MaintenanceRequest {
  title: string;
  description: string;
  location: string;
  category: string;
  photos: { uri?: string; type?: string; fileName?: string }[];
}

export const submitMaintenanceRequest = async (requestData: MaintenanceRequest) => {
  const formData = new FormData();

  formData.append('title', requestData.title);
  formData.append('description', requestData.description);
  formData.append('location', requestData.location);
  formData.append('category', requestData.category);

  requestData.photos.forEach(photo => {
    formData.append('photos', {
      uri: photo.uri,
      type: photo.type,
      name: photo.fileName,
    } as any);
  });

  try {
    const response = await fetch('/api/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to submit request. Please try again.');
    }

    const json = await response.json();
    Alert.alert('Success', `Request submitted: ${JSON.stringify(json)}`);
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
