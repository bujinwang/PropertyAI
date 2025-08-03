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
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { RootStackParamList } from '@/navigation/types';
import { rentalService } from '@/services/rentalService';
import { CreateRentalDto } from '@/types/rental';
import { Rental } from '@/types/rental';

type CreateListingScreenRouteProp = RouteProp<RootStackParamList, 'CreateListing'>;

interface CreateListingFormValues {
  title: string;
  description: string;
  price: string;
  status: string;
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
  const [rental, setRental] = useState<Rental | null>(null);
  const [listingType, setListingType] = useState<'UNIT' | 'PROPERTY'>(unitId ? 'UNIT' : 'PROPERTY');

  useEffect(() => {
    loadDetails();
  }, [unitId, propertyId]);

  const loadDetails = async () => {
    try {
      if (unitId || propertyId) {
        const rentalData = await rentalService.getRentalById(unitId || propertyId);
        setRental(rentalData);
        setListingType(rentalData.unitNumber ? 'UNIT' : 'PROPERTY');
      }
    } catch (error) {
      console.error('Failed to load rental details:', error);
      Alert.alert('Error', 'Failed to load rental details');
    }
  };

  const initialValues: CreateListingFormValues = {
    title: '',
    description: '',
    price: '',
    status: 'DRAFT',
  };

  const handleSubmit = async (values: CreateListingFormValues) => {
    setLoading(true);
    try {
      const rentalData: CreateRentalDto = {
        title: values.title,
        description: values.description,
        rent: parseFloat(values.price),
        address: rental?.address || '',
        city: rental?.city || '',
        state: rental?.state || '',
        zipCode: rental?.zipCode || '',
        propertyType: rental?.propertyType || 'APARTMENT',
        status: values.status,
        isActive: values.status === 'ACTIVE',
        managerId: rental?.managerId || '',
        ownerId: rental?.ownerId || '',
        createdById: rental?.createdById || '',
      };

      await rentalService.createRental(rentalData);
      Alert.alert('Success', 'Rental listing created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create rental listing:', error);
      Alert.alert('Error', 'Failed to create rental listing');
    } finally {
      setLoading(false);
    }
  };

  const generateAutoTitle = () => {
    if (listingType === 'UNIT' && rental && rental.unitNumber) {
      const features = [];
      if (rental.bedrooms) features.push(`${rental.bedrooms} bed`);
      if (rental.bathrooms) features.push(`${rental.bathrooms} bath`);
      if (rental.size) features.push(`${rental.size} sq ft`);
      
      const featuresText = features.length > 0 ? ` - ${features.join(', ')}` : '';
      return `Unit ${rental.unitNumber} Available${featuresText}`;
    } else if (listingType === 'PROPERTY' && rental) {
      if (rental.totalUnits === 1) {
        return `${rental.title || 'Beautiful'} ${rental.propertyType} Available`;
      } else {
        return `${rental.title || 'Property'} - ${rental.totalUnits} Unit ${rental.propertyType} Available`;
      }
    }
    return '';
  };

  const generateAutoDescription = () => {
    if (listingType === 'UNIT' && rental && rental.unitNumber) {
      let description = `Beautiful unit ${rental.unitNumber} available for rent`;
      
      if (rental.bedrooms && rental.bathrooms) {
        description += ` featuring ${rental.bedrooms} bedroom${rental.bedrooms > 1 ? 's' : ''} and ${rental.bathrooms} bathroom${rental.bathrooms > 1 ? 's' : ''}`;
      }
      
      if (rental.size) {
        description += ` with ${rental.size} square feet of living space`;
      }
      
      if (rental.floorNumber) {
        description += ` located on floor ${rental.floorNumber}`;
      }
      
      if (rental.amenities && Object.keys(rental.amenities).length > 0) {
        const amenityList = Object.keys(rental.amenities).filter(key => rental.amenities[key]);
        description += `. Features include: ${amenityList.join(', ')}`;
      }
      
      if (rental.availableDate) {
        description += `. Available from ${new Date(rental.availableDate).toLocaleDateString()}`;
      }
      
      description += `. Don't miss this opportunity!`;
      return description;
    } else if (listingType === 'PROPERTY' && rental) {
      let description = `Beautiful ${rental.propertyType} property available for rent`;
      
      if (rental.address) {
        description += ` located at ${rental.address}`;
      }
      
      if (rental.totalUnits === 1) {
        description += `. This single-family home offers comfortable living with modern amenities`;
      } else {
        description += `. This ${rental.totalUnits}-unit ${rental.propertyType} offers great investment potential`;
      }
      
      if (rental.amenities && Object.keys(rental.amenities).length > 0) {
        const amenityList = Object.keys(rental.amenities).filter(key => rental.amenities[key]);
        description += `. Features include: ${amenityList.join(', ')}`;
      }
      
      if (rental.yearBuilt) {
        description += `. Built in ${rental.yearBuilt}`;
      }
      
      description += `. Contact us for current availability and pricing!`;
      return description;
    }
    return '';
  };

  const handleAutoGenerate = (setFieldValue: any) => {
    setFieldValue('title', generateAutoTitle());
    setFieldValue('description', generateAutoDescription());
    
    if (rental && rental.rent) {
      setFieldValue('price', rental.rent.toString());
    } else {
      // Default price based on property type
      const defaultPrice = rental?.propertyType === 'HOUSE' ? 2000 : 
                          rental?.propertyType === 'APARTMENT' ? 1500 : 1200;
      setFieldValue('price', defaultPrice.toString());
    }
  };

  if (!rental) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading rental details...</Text>
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
                error={(touched.title && errors.title) || undefined}
                placeholder="e.g., Beautiful 2-bedroom apartment with balcony"
              />

              <TextInput
                label="Description"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                error={(touched.description && errors.description) || undefined}
                placeholder="Describe the unit, amenities, location, etc."
                multiline
                style={styles.descriptionInput}
              />

              <TextInput
                label="Monthly Rent ($)"
                value={values.price}
                onChangeText={handleChange('price')}
                onBlur={handleBlur('price')}
                error={(touched.price && errors.price) || undefined}
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
    backgroundColor: COLORS.card,
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
    color: '#FFFFFF',
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
