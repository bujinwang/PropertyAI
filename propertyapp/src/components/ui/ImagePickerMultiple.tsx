import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerMultipleProps {
  images: Array<{ uri: string; name: string; type: string }>;
  onChange: (images: Array<{ uri: string; name: string; type: string }>) => void;
  maxImages?: number;
  error?: string;
}

// Define interface for asset type
interface ImageAsset {
  uri: string;
  width?: number;
  height?: number;
  assetId?: string;
  base64?: string;
  exif?: Record<string, any>;
  duration?: number;
}

export function ImagePickerMultiple({
  images,
  onChange,
  maxImages = 10,
  error,
}: ImagePickerMultipleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const pickImages = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images.`);
      return;
    }

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      setIsLoading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled && result.assets) {
        // Format the selected images
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.uri.split('/').pop() || `image-${Date.now()}.jpg`,
          type: 'image/jpeg', // Assuming JPEG for simplicity
        }));

        // Check if adding these would exceed the maximum
        if (images.length + newImages.length > maxImages) {
          const remaining = maxImages - images.length;
          Alert.alert(
            'Maximum Images',
            `Only ${remaining} more ${remaining === 1 ? 'image' : 'images'} can be added. Some selections were omitted.`
          );
          onChange([...images, ...newImages.slice(0, remaining)]);
        } else {
          onChange([...images, ...newImages]);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images.`);
      return;
    }

    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      setIsLoading(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newImage = {
          uri: asset.uri,
          name: asset.uri.split('/').pop() || `image-${Date.now()}.jpg`,
          type: 'image/jpeg',
        };

        onChange([...images, newImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    onChange(updatedImages);
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onChange(updatedImages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Images</Text>
        <Text style={styles.count}>
          {images.length} / {maxImages}
        </Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imageScrollContainer}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.imageActionButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
              
              {index > 0 && (
                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={() => reorderImages(index, index - 1)}
                >
                  <Ionicons name="arrow-back" size={18} color={COLORS.text.primary} />
                </TouchableOpacity>
              )}
              
              {index < images.length - 1 && (
                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={() => reorderImages(index, index + 1)}
                >
                  <Ionicons name="arrow-forward" size={18} color={COLORS.text.primary} />
                </TouchableOpacity>
              )}
            </View>
            
            {index === 0 && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Primary</Text>
              </View>
            )}
          </View>
        ))}

        {images.length < maxImages && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.addButton, styles.galleryButton]}
              onPress={pickImages}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.addButtonText}>Gallery</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addButton, styles.cameraButton]}
              onPress={takePhoto}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.addButtonText}>Camera</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Text style={styles.helperText}>
        Drag to reorder. The first image will be the primary image shown in listings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium as '500',
    color: COLORS.text.primary,
  },
  count: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
  },
  imageScrollContainer: {
    paddingVertical: SPACING.sm,
  },
  imageContainer: {
    marginRight: SPACING.sm,
    position: 'relative',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: RADIUS.md,
  },
  imageActions: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    flexDirection: 'row',
  },
  imageActionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  primaryBadgeText: {
    color: COLORS.background,
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium as '500',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: 150,
    gap: SPACING.sm,
  },
  addButton: {
    width: 100,
    height: 70,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  galleryButton: {
    marginBottom: SPACING.xs,
  },
  cameraButton: {},
  addButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
}); 