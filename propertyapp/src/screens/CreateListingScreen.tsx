import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { RootStackParamList } from '@/navigation/types';
import { listingService } from '@/services/listingService';
import { unitService } from '@/services/unitService';
import { propertyService } from '@/services/propertyService';
import { CreateListingRequest, ListingStatus } from '@/types/listing';
import { Unit } from '@/types/unit';

type CreateListingScreenRouteProp = RouteProp<RootStackParamList, 'CreateListing'>;

interface CreateListingFormValues {
  title: string;
  description: string;
  price: string;
  status: ListingStatus;
}

const validationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  price: Yup.number()
    .required('Price is required')
    .positive('Price must be positive')
    .integer('Price must be a whole number'),
});

const CreateListingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateListingScreenRouteProp>();
  const { unitId, propertyId } = route.params;

  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [listingType, setListingType] = useState<'UNIT' | 'PROPERTY'>(unitId ? 'UNIT' : 'PROPERTY');

  useEffect(() => {
    loadDetails();
  }, [unitId, propertyId]);

  const loadDetails = async () => {
    try {
      if (unitId) {
        const unitData = await unitService.getUnitById(unitId);
        setUnit(unitData);
        setListingType('UNIT');
      } else {
        const propertyData = await propertyService.getPropertyById(propertyId);
        setProperty(propertyData);
        setListingType('PROPERTY');
      }
    } catch (error) {
      console.error('Failed to load details:', error);
      Alert.alert('Error', 'Failed to load property/unit details');
    }
  };

  const initialValues: CreateListingFormValues = {
    title: '',
    description: '',
    price: '',
    status: ListingStatus.DRAFT,
  };

  const handleSubmit = async (values: CreateListingFormValues) => {
    setLoading(true);
    try {
      const listingData: CreateListingRequest = {
        title: values.title,
        description: values.description,
        price: parseFloat(values.price),
        propertyId: propertyId,
        unitId: unitId || undefined,
        status: values.status,
      };

      await listingService.createListing(listingData);
      Alert.alert('Success', 'Listing created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create listing:', error);
      Alert.alert('Error', 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const generateAutoTitle = () => {
    if (listingType === 'UNIT' && unit) {
      const features = [];
      if (unit.bedrooms) features.push(`${unit.bedrooms} bed`);
      if (unit.bathrooms) features.push(`${unit.bathrooms} bath`);
      if (unit.size) features.push(`${unit.size} sq ft`);
      
      const featuresText = features.length > 0 ? ` - ${features.join(', ')}` : '';
      return `Unit ${unit.unitNumber} Available${featuresText}`;
    } else if (listingType === 'PROPERTY' && property) {
      if (property.totalUnits === 1) {
        return `${property.name || 'Beautiful'} ${property.propertyType} Available`;
      } else {
        return `${property.name || 'Property'} - ${property.totalUnits} Unit ${property.propertyType} Available`;
      }
    }
    return '';
  };

  const generateAutoDescription = () => {
    if (listingType === 'UNIT' && unit) {
      let description = `Beautiful unit ${unit.unitNumber} available for rent`;
      
      if (unit.bedrooms && unit.bathrooms) {
        description += ` featuring ${unit.bedrooms} bedroom${unit.bedrooms > 1 ? 's' : ''} and ${unit.bathrooms} bathroom${unit.bathrooms > 1 ? 's' : ''}`;
      }
      
      if (unit.size) {
        description += ` with ${unit.size} square feet of living space`;
      }
      
      if (unit.floorNumber) {
        description += ` located on floor ${unit.floorNumber}`;
      }
      
      if (unit.features && unit.features.length > 0) {
        description += `. Features include: ${unit.features.join(', ')}`;
      }
      
      if (unit.dateAvailable) {
        description += `. Available from ${unit.dateAvailable}`;
      }
      
      description += `. Don't miss this opportunity!`;
      return description;
    } else if (listingType === 'PROPERTY' && property) {
      let description = `Beautiful ${property.propertyType} property available for rent`;
      
      if (property.address) {
        description += ` located at ${property.address}`;
      }
      
      if (property.totalUnits === 1) {
        description += `. This single-family home offers comfortable living with modern amenities`;
      } else {
        description += `. This ${property.totalUnits}-unit ${property.propertyType} offers great investment potential`;
      }
      
      if (property.amenities && property.amenities.length > 0) {
        description += `. Features include: ${property.amenities.join(', ')}`;
      }
      
      if (property.yearBuilt) {
        description += `. Built in ${property.yearBuilt}`;
      }
      
      description += `. Contact us for current availability and pricing!`;
      return description;
    }
    return '';
  };

  const handleAutoGenerate = (setFieldValue: any) => {
    setFieldValue('title', generateAutoTitle());
    setFieldValue('description', generateAutoDescription());
    
    if (listingType === 'UNIT' && unit && unit.rent) {
      setFieldValue('price', unit.rent.toString());
    } else if (listingType === 'PROPERTY' && property) {
      // Default price for property listings based on type and location
      const defaultPrice = property.propertyType === 'house' ? 2000 : 
                          property.propertyType === 'apartment' ? 1500 : 1200;
      setFieldValue('price', defaultPrice.toString());
    }
  };

  if (!unit && !property) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Create {listingType === 'UNIT' ? 'Unit' : 'Property'} Listing
          </Text>
          <Text style={styles.subtitle}>
            {listingType === 'UNIT' ? `Unit ${unit?.unitNumber}` : property?.name || 'Property'}
          </Text>
        </View>

        {listingType === 'UNIT' && unit && (
          <View style={styles.unitInfo}>
            <View style={styles.unitDetails}>
              <Text style={styles.unitSpecs}>
                {unit.bedrooms || 0} bed • {unit.bathrooms || 0} bath • {unit.size || 0} sq ft
              </Text>
              {unit.rent && (
                <Text style={styles.unitRent}>Current rent: ${unit.rent}/month</Text>
              )}
            </View>
          </View>
        )}

        {listingType === 'PROPERTY' && property && (
          <View style={styles.unitInfo}>
            <View style={styles.unitDetails}>
              <Text style={styles.unitSpecs}>
                {property.propertyType} • {property.totalUnits} unit{property.totalUnits !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.unitRent}>
                {property.address || property.city}, {property.state}
              </Text>
            </View>
          </View>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              <TouchableOpacity
                style={styles.autoGenerateButton}
                onPress={() => handleAutoGenerate(setFieldValue)}
              >
                <Text style={styles.autoGenerateText}>
                  Auto-generate from unit details
                </Text>
              </TouchableOpacity>

              <TextInput
                label="Listing Title"
                value={values.title}
                onChangeText={handleChange('title')}
                onBlur={handleBlur('title')}
                error={touched.title && errors.title}
                placeholder="e.g., Beautiful 2-bedroom apartment with balcony"
              />

              <TextInput
                label="Description"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                error={touched.description && errors.description}
                placeholder="Describe the unit, amenities, location, etc."
                multiline
                style={styles.descriptionInput}
              />

              <TextInput
                label="Monthly Rent ($)"
                value={values.price}
                onChangeText={handleChange('price')}
                onBlur={handleBlur('price')}
                error={touched.price && errors.price}
                placeholder="e.g., 1200"
                keyboardType="numeric"
              />

              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>Status</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      values.status === ListingStatus.DRAFT && styles.activeStatus,
                    ]}
                    onPress={() => setFieldValue('status', ListingStatus.DRAFT)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        values.status === ListingStatus.DRAFT && styles.activeStatusText,
                      ]}
                    >
                      Draft
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      values.status === ListingStatus.ACTIVE && styles.activeStatus,
                    ]}
                    onPress={() => setFieldValue('status', ListingStatus.ACTIVE)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        values.status === ListingStatus.ACTIVE && styles.activeStatusText,
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Create Listing"
                  onPress={handleSubmit as any}
                  disabled={loading}
                  style={styles.submitButton}
                />
                <Button
                  title="Cancel"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={styles.cancelButton}
                />
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  unitInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  unitDetails: {
    alignItems: 'center',
  },
  unitSpecs: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  unitRent: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  form: {
    gap: SPACING.md,
  },
  autoGenerateButton: {
    backgroundColor: COLORS.primary + '20',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  autoGenerateText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  statusSection: {
    marginTop: SPACING.md,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activeStatus: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  activeStatusText: {
    color: COLORS.white,
  },
  buttonContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  cancelButton: {
    marginTop: SPACING.sm,
  },
});

export default CreateListingScreen;