import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, IconButton, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { maintenanceService } from '@/services/maintenanceService';

interface AddPhotosScreenProps {
  route: {
    params: {
      requestId: string;
      type?: 'maintenance' | 'property';
    };
  };
  navigation: any;
}

interface Photo {
  uri: string;
  type: 'image/jpeg' | 'image/png';
  name: string;
  size?: number;
}

export function AddPhotosScreen({ route, navigation }: AddPhotosScreenProps) {
  const { requestId, type = 'maintenance' } = route.params;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library permissions are required to add photos.'
        );
      }
    })();
  }, []);

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((asset) => ({
          uri: asset.uri,
          type: (asset.type === 'image' ? 'image/jpeg' : 'image/jpeg') as 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          size: asset.fileSize,
        }));

        setPhotos([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [4, 3],
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newPhoto: Photo = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize,
        };

        setPhotos([...photos, newPhoto]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newPhotos = photos.filter((_, i) => i !== index);
          setPhotos(newPhotos);
        },
      },
    ]);
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please add at least one photo');
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      
      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: photo.type,
          name: photo.name,
        } as any);
      });

      // Upload based on type
      if (type === 'maintenance') {
        await maintenanceService.uploadPhotos(requestId, formData);
      } else {
        // Property photos upload
        // await propertyService.uploadPhotos(requestId, formData);
      }

      Alert.alert('Success', 'Photos uploaded successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.instructionTitle}>
              Add Photos
            </Text>
            <Text variant="bodyMedium" style={styles.instructionText}>
              Take photos or select from your library. You can add multiple photos.
            </Text>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="camera"
            onPress={takePhoto}
            style={styles.actionButton}
            disabled={uploading}
          >
            Take Photo
          </Button>
          <Button
            mode="outlined"
            icon="image"
            onPress={pickImageFromLibrary}
            style={styles.actionButton}
            disabled={uploading}
          >
            Choose from Library
          </Button>
        </View>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <Card style={styles.photosCard}>
            <Card.Title
              title={`${photos.length} ${photos.length === 1 ? 'Photo' : 'Photos'} Selected`}
            />
            <Card.Content>
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.photo} />
                    <IconButton
                      icon="close-circle"
                      size={24}
                      iconColor="#fff"
                      style={styles.removeButton}
                      onPress={() => removePhoto(index)}
                      disabled={uploading}
                    />
                    <View style={styles.photoInfo}>
                      <Text variant="bodySmall" style={styles.photoSize}>
                        {formatFileSize(photo.size)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <View style={styles.emptyState}>
            <IconButton icon="camera-outline" size={64} iconColor="#ccc" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Photos Added
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Use the buttons above to add photos
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Upload Button */}
      {photos.length > 0 && (
        <View style={styles.uploadContainer}>
          <Button
            mode="contained"
            icon="upload"
            onPress={uploadPhotos}
            loading={uploading}
            disabled={uploading}
            style={styles.uploadButton}
          >
            {uploading ? 'Uploading...' : `Upload ${photos.length} ${photos.length === 1 ? 'Photo' : 'Photos'}`}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  instructionCard: {
    marginBottom: 16,
  },
  instructionTitle: {
    marginBottom: 8,
  },
  instructionText: {
    color: '#666',
  },
  actionButtons: {
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  photosCard: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  photoContainer: {
    width: '33.33%',
    padding: 4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  photoInfo: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 4,
  },
  photoSize: {
    color: '#fff',
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  emptyText: {
    color: '#999',
  },
  uploadContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uploadButton: {
    paddingVertical: 8,
  },
});

export default AddPhotosScreen;
