import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type MaintenanceRequestFormScreenProps = NavigationProps<'MaintenanceList'>;

interface MaintenanceRequest {
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  location: string;
  photos: string[];
}

const categories = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Structural',
  'Pest Control',
  'Lock/Access',
  'Other',
];

const urgencyLevels = [
  { key: 'low', label: 'Low - Can wait', color: '#28a745' },
  { key: 'medium', label: 'Medium - This week', color: '#ffc107' },
  { key: 'high', label: 'High - This week', color: '#fd7e14' },
  { key: 'emergency', label: 'Emergency - Today', color: '#dc3545' },
];

export function MaintenanceRequestFormScreen({ navigation }: MaintenanceRequestFormScreenProps) {
  const [formData, setFormData] = useState<MaintenanceRequest>({
    title: '',
    description: '',
    category: '',
    urgency: 'medium',
    location: '',
    photos: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (field: keyof MaintenanceRequest, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPhoto = () => {
    Alert.alert(
      'Add Photo',
      'Choose photo source',
      [
        { text: 'Camera', onPress: () => addPhotoFromCamera() },
        { text: 'Photo Library', onPress: () => addPhotoFromLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const addPhotoFromCamera = () => {
    // Mock camera functionality
    const mockPhotoUri = `photo_${Date.now()}.jpg`;
    updateFormData('photos', [...formData.photos, mockPhotoUri]);
    Alert.alert('Success', 'Photo added from camera');
  };

  const addPhotoFromLibrary = () => {
    // Mock photo library functionality
    const mockPhotoUri = `library_${Date.now()}.jpg`;
    updateFormData('photos', [...formData.photos, mockPhotoUri]);
    Alert.alert('Success', 'Photo added from library');
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    updateFormData('photos', newPhotos);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the maintenance request');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please specify the location');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Success',
        'Your maintenance request has been submitted successfully. You will receive a confirmation email and our team will contact you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 2000);
  };

  const renderPhotoGrid = () => (
    <View style={styles.photoGrid}>
      {formData.photos.map((photo, index) => (
        <View key={index} style={styles.photoContainer}>
          <Image
            source={{ uri: photo }}
            style={styles.photo}
            defaultSource={require('../assets/placeholder-image.png')}
          />
          <TouchableOpacity
            style={styles.removePhotoButton}
            onPress={() => removePhoto(index)}
          >
            <Text style={styles.removePhotoText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      {formData.photos.length < 5 && (
        <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
          <Text style={styles.addPhotoIcon}>📷</Text>
          <Text style={styles.addPhotoText}>Add Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Submit Maintenance Request</Text>
          <Text style={styles.subtitle}>Report an issue that needs attention</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief description of the issue"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.selectedCategory,
                  ]}
                  onPress={() => updateFormData('category', category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      formData.category === category && styles.selectedCategoryText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Urgency Level *</Text>
            <View style={styles.urgencyContainer}>
              {urgencyLevels.map((level) => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.urgencyButton,
                    formData.urgency === level.key && styles.selectedUrgency,
                  ]}
                  onPress={() => updateFormData('urgency', level.key)}
                >
                  <View style={[styles.urgencyDot, { backgroundColor: level.color }]} />
                  <Text
                    style={[
                      styles.urgencyText,
                      formData.urgency === level.key && styles.selectedUrgencyText,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Kitchen, Bedroom 2, Hallway"
              value={formData.location}
              onChangeText={(value) => updateFormData('location', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              placeholder="Please provide detailed information about the issue..."
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos (Optional)</Text>
            <Text style={styles.photoHint}>
              Add up to 5 photos to help us understand the issue better
            </Text>
            {renderPhotoGrid()}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryText: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  urgencyContainer: {
    gap: 8,
  },
  urgencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
  },
  selectedUrgency: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  urgencyText: {
    fontSize: 16,
    color: '#212529',
  },
  selectedUrgencyText: {
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
  addPhotoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});