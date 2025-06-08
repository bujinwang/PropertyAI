import React, { useState } from 'react';
import {
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { submitMaintenanceRequest } from '../services/maintenanceService';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  photos: { url: string }[];
}

const MaintenanceScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [submittedRequests, setSubmittedRequests] = useState<MaintenanceRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await fetch('/api/maintenance');
      const json = await response.json();
      setSubmittedRequests(json);
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
    }
  };

  useState(() => {
    fetchMaintenanceRequests();
  });

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Could not select image. Please try again.');
      } else if (response.assets) {
        setPhotos(prevPhotos => [...prevPhotos, ...response.assets!]);
      }
    });
  };

  const removePhoto = (uri: string) => {
    setPhotos(photos.filter(photo => photo.uri !== uri));
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description.');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter a location.');
      return false;
    }
    if (!category.trim()) {
      Alert.alert('Validation Error', 'Please enter a category.');
      return false;
    }
    return true;
  };

  const submitRequest = async () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await submitMaintenanceRequest({
        title,
        description,
        location,
        category,
        photos: photos.map(p => ({ uri: p.uri, type: p.type, fileName: p.fileName })),
      });
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('');
      setPhotos([]);
      fetchMaintenanceRequests();
    } catch (error) {
      // Error is already handled in the service
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Submit Maintenance Request</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Leaky Faucet"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Describe the issue in detail."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Kitchen Sink, Apartment 4B"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Plumbing, Electrical, General"
        value={category}
        onChangeText={setCategory}
      />

      <TouchableOpacity style={styles.photoButton} onPress={handleChoosePhoto}>
        <Text style={styles.photoButtonText}>Add Photos</Text>
      </TouchableOpacity>

      <View style={styles.photoPreviewContainer}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoPreview}>
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => removePhoto(photo.uri!)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Button
        title={isSubmitting ? 'Submitting...' : 'Submit Request'}
        onPress={submitRequest}
        disabled={isSubmitting}
      />

      <Text style={styles.header}>Submitted Requests</Text>
      <FlatList
        data={submittedRequests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>Status: {item.status}</Text>
            {item.photos.length > 0 && (
              <Image source={{ uri: item.photos[0].url }} style={styles.itemImage} />
            )}
          </View>
        )}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#495057',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  photoPreview: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  requestItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 5,
    marginTop: 10,
  },
});

export default MaintenanceScreen;
