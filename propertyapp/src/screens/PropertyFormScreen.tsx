import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { ImagePickerMultiple } from '@/components/ui/ImagePickerMultiple';
import { SelectInput } from '@/components/ui/SelectInput';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { useAuth } from '@/contexts/AuthContext';
import { propertyService } from '@/services/propertyService';
import { aiService } from '@/services/aiService';
import { RootStackParamList } from '@/navigation/types';
import { Property, PropertyType } from '@/types/property';

type PropertyFormScreenRouteProp = RouteProp<RootStackParamList, 'PropertyForm'>;

interface PropertyFormValues {
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  propertyType: string;
  amenities: string[];
  yearBuilt: string;
  totalUnits: string;
  images: Array<{ uri: string; name: string; type: string }>;
}

const initialValues: PropertyFormValues = {
  name: '',
  description: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  },
  propertyType: '',
  amenities: [],
  yearBuilt: '',
  totalUnits: '1',
  images: [],
};

const propertyTypes = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Other', value: 'other' },
];

const amenityOptions = [
  { label: 'Air Conditioning', value: 'airConditioning' },
  { label: 'Heating', value: 'heating' },
  { label: 'Washer/Dryer', value: 'washerDryer' },
  { label: 'Parking', value: 'parking' },
  { label: 'Pool', value: 'pool' },
  { label: 'Gym', value: 'gym' },
  { label: 'Pet Friendly', value: 'petFriendly' },
  { label: 'Furnished', value: 'furnished' },
  { label: 'Elevator', value: 'elevator' },
  { label: 'Balcony', value: 'balcony' },
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Property name is required'),
  description: Yup.string().required('Description is required'),
  address: Yup.object().shape({
    street: Yup.string().required('Street address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    zipCode: Yup.string().required('ZIP code is required'),
    country: Yup.string().required('Country is required'),
  }),
  propertyType: Yup.string().required('Property type is required'),
  yearBuilt: Yup.string()
    .required('Year built is required')
    .matches(/^[0-9]{4}$/, 'Year must be 4 digits')
    .test('valid-year', 'Year must be between 1800 and current year', 
      value => {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        return year >= 1800 && year <= currentYear;
      }),
  totalUnits: Yup.string()
    .required('Total units is required')
    .matches(/^[1-9][0-9]*$/, 'Must be a positive number'),
  images: Yup.array().min(1, 'At least one image is required'),
});

export function PropertyFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<PropertyFormScreenRouteProp>();
  const { user } = useAuth();
  const propertyId = route.params?.propertyId;
  const isEditing = !!propertyId;

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [property, setProperty] = useState<PropertyFormValues>(initialValues);

  const steps = [
    'Basic Info',
    'Address',
    'Features',
    'Images & AI',
    'Review',
  ];

  useEffect(() => {
    console.log('PropertyFormScreen mounted. Property ID:', propertyId);
    if (isEditing) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;
    
    try {
      setIsLoading(true);
      const propertyData = await propertyService.getPropertyById(propertyId);
      console.log('Fetched property data:', propertyData);
      
      // Map API response to form values
      const newPropertyState = {
        name: propertyData.name || '',
        description: propertyData.description || '',
        address: {
          street: propertyData.address || '',
          city: propertyData.city || '',
          state: propertyData.state || '',
          zipCode: propertyData.zipCode || '',
          country: propertyData.country || 'US',
        },
        propertyType: propertyData.propertyType?.toLowerCase() || '',
        amenities: propertyData.amenities || [],
        yearBuilt: propertyData.yearBuilt?.toString() || '',
        totalUnits: propertyData.totalUnits?.toString() || '1',
        images: propertyData.images?.map((img: any) => ({
          uri: img.url || img.uri,
          name: img.originalFilename || img.filename || 'property-image.jpg',
          type: img.mimetype || 'image/jpeg'
        })) || [],
      };
      setProperty(newPropertyState);
      console.log('Set property state to:', newPropertyState);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching property details:', error);
      Alert.alert('Error', 'Failed to load property details');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: PropertyFormValues) => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        name: values.name,
        description: values.description,
        address: values.address.street,
        city: values.address.city,
        state: values.address.state,
        zipCode: values.address.zipCode,
        country: values.address.country,
        propertyType: values.propertyType.toUpperCase() as PropertyType,
        amenities: values.amenities,
        yearBuilt: parseInt(values.yearBuilt, 10),
        totalUnits: parseInt(values.totalUnits, 10),
        // images are handled separately
      };

      let response: any;
      if (isEditing) {
        response = await propertyService.updateProperty(propertyId, submissionData);
      } else {
        response = await propertyService.createProperty(submissionData);
      }
      console.log('API response:', response);
      Alert.alert(
        isEditing ? 'Property Updated' : 'Property Created',
        isEditing ? 'Your property has been successfully updated.' : 'Your new property has been successfully created.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting property:', error);
      Alert.alert('Error', 'There was an error submitting the property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIDescription = async (values: PropertyFormValues, setFieldValue: FormikProps<PropertyFormValues>['setFieldValue']) => {
    if (!propertyId) {
      Alert.alert('Error', 'Property must be saved before generating AI description.');
      return;
    }
    if (values.images.length === 0) {
      Alert.alert('Error', 'Please upload at least one image to generate description');
      return;
    }

    try {
      setIsAiGenerating(true);
      
      // Use property data for AI generation
      const propertyDetails = {
        propertyType: values.propertyType,
        bedrooms: '2', // Default value for AI generation
        bathrooms: '2', // Default value for AI generation
        amenities: values.amenities,
        images: values.images
      };

      const response = await aiService.generatePropertyDescription(propertyId, propertyDetails);
      setFieldValue('description', response.description);
      setIsAiGenerating(false);
      Alert.alert('Success', 'AI-generated description has been added');
    } catch (error) {
      console.error('Error generating AI description:', error);
      Alert.alert('Error', 'Failed to generate AI description');
      setIsAiGenerating(false);
    }
  };

  const getPricingRecommendation = async (values: PropertyFormValues, setFieldValue: FormikProps<PropertyFormValues>['setFieldValue']) => {
    try {
      setIsPricingLoading(true);
      
      // Use property data for pricing analysis
      const propertyDetails = {
        address: {
          street: values.address.street,
          city: values.address.city,
          state: values.address.state,
          zipCode: values.address.zipCode,
        },
        propertyType: values.propertyType,
        bedrooms: '2', // Default value for pricing
        bathrooms: '2', // Default value for pricing
        squareFeet: '1000', // Default value for pricing
        amenities: values.amenities,
        yearBuilt: values.yearBuilt
      };

      const response = await aiService.generatePricingRecommendations(propertyDetails);
      
      Alert.alert(
        'Pricing Recommendation', 
        `Recommended monthly rent: $${response.recommendedPrice}\nRange: $${response.priceRange.min} - $${response.priceRange.max}`
      );
      
    } catch (error) {
      console.error('Error getting pricing recommendation:', error);
      Alert.alert('Error', 'Failed to get pricing recommendation.');
    } finally {
      setIsPricingLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading && isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Formik
        initialValues={property}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }: FormikProps<PropertyFormValues>) => {
          const stateLabel = values.address.country === 'Canada' ? 'Province' : 'State';
          return (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {isEditing ? 'Edit Property' : 'Add New Property'}
                </Text>
                <StepIndicator
                  steps={steps}
                  currentStep={currentStep}
                  onStepPress={setCurrentStep}
                />
              </View>

              <ScrollView style={styles.content}>
                {currentStep === 0 && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Basic Information</Text>
                    
                    <TextInput
                      label="Property Name"
                      value={values.name}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                      error={touched.name ? errors.name : undefined}
                      placeholder="Enter a name for your property"
                    />

                    <TextInput
                      label="Description"
                      value={values.description}
                      onChangeText={handleChange('description')}
                      onBlur={handleBlur('description')}
                      error={touched.description ? errors.description : undefined}
                      placeholder="Describe your property (or leave empty for AI generation later)"
                      multiline
                      numberOfLines={4}
                    />

                    <SelectInput
                      label="Property Type"
                      value={values.propertyType}
                      onChange={(value: string | number) => setFieldValue('propertyType', value)}
                      options={propertyTypes}
                      error={touched.propertyType ? errors.propertyType : undefined}
                    />

                    <TextInput
                      label="Total Units"
                      value={values.totalUnits}
                      onChangeText={handleChange('totalUnits')}
                      onBlur={handleBlur('totalUnits')}
                      error={touched.totalUnits ? errors.totalUnits : undefined}
                      placeholder="Total number of units in the property"
                      keyboardType="numeric"
                    />
                  </View>
                )}

                {currentStep === 1 && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Property Address</Text>
                    
                    <TextInput
                      label="Street Address"
                      value={values.address.street}
                      onChangeText={handleChange('address.street')}
                      onBlur={handleBlur('address.street')}
                      error={touched.address?.street ? errors.address?.street : undefined}
                      placeholder="Enter street address"
                    />

                    <TextInput
                      label="City"
                      value={values.address.city}
                      onChangeText={handleChange('address.city')}
                      onBlur={handleBlur('address.city')}
                      error={touched.address?.city ? errors.address?.city : undefined}
                      placeholder="Enter city"
                    />

                    <View style={styles.row}>
                      <View style={styles.halfColumn}>
                        <TextInput
                          label={stateLabel}
                          value={values.address.state}
                          onChangeText={handleChange('address.state')}
                          onBlur={handleBlur('address.state')}
                          error={touched.address?.state ? errors.address?.state : undefined}
                          placeholder={stateLabel}
                        />
                      </View>
                      
                      <View style={styles.halfColumn}>
                        <TextInput
                          label="ZIP Code"
                          value={values.address.zipCode}
                          onChangeText={handleChange('address.zipCode')}
                          onBlur={handleBlur('address.zipCode')}
                          error={touched.address?.zipCode ? errors.address?.zipCode : undefined}
                          placeholder="ZIP Code"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <SelectInput
                      label="Country"
                      value={values.address.country}
                      onChange={(value) => {
                        setFieldValue('address.country', value);
                      }}
                      options={[
                        { label: 'United States', value: 'USA' },
                        { label: 'Canada', value: 'CA' },
                      ]}
                      error={touched.address?.country ? errors.address?.country : undefined}
                    />
                  </View>
                )}

                {currentStep === 2 && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Property Details</Text>
                    
                    <TextInput
                      label="Year Built"
                      value={values.yearBuilt}
                      onChangeText={handleChange('yearBuilt')}
                      onBlur={handleBlur('yearBuilt')}
                      error={touched.yearBuilt ? errors.yearBuilt : undefined}
                      placeholder="Year Built"
                      keyboardType="numeric"
                    />

                    <Text style={styles.sectionTitle}>Amenities</Text>
                    <CheckboxGroup
                      label="Amenities"
                      options={amenityOptions}
                      selectedValues={values.amenities}
                      onChange={(selectedItems: string[]) => setFieldValue('amenities', selectedItems)}
                      error={touched.amenities ? (errors.amenities as string) : undefined}
                    />
                  </View>
                )}

                {currentStep === 3 && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Property Images & AI Features</Text>
                    <Text style={styles.subtitle}>
                      Add images of your property and use AI to enhance your listing.
                    </Text>

                    <ImagePickerMultiple
                      images={values.images}
                      onChange={(images: Array<{ uri: string; name: string; type: string }>) => setFieldValue('images', images)}
                      maxImages={10}
                      error={touched.images ? (errors.images as string) : undefined}
                    />

                    {values.images.length > 0 && (
                      <>
                        <View style={styles.aiSection}>
                          <Text style={styles.sectionTitle}>AI-Generated Description</Text>
                          <Text style={styles.subtitle}>
                            Generate a compelling property description based on your property details and images.
                          </Text>
                          <Button
                            title="Generate AI Description"
                            onPress={() => generateAIDescription(values, setFieldValue)}
                            loading={isAiGenerating}
                            variant="secondary"
                          />
                        </View>

                        <View style={styles.aiSection}>
                          <Text style={styles.sectionTitle}>Pricing Recommendation</Text>
                          <Text style={styles.subtitle}>
                            Get market-based pricing recommendations for your property.
                          </Text>
                          <Button
                            title="Get Pricing Recommendation"
                            onPress={() => getPricingRecommendation(values, setFieldValue)}
                            loading={isPricingLoading}
                            variant="secondary"
                          />
                        </View>
                      </>
                    )}
                  </View>
                )}

                {currentStep === 4 && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Review Property</Text>
                    <Text style={styles.subtitle}>
                      Please review the details of your property listing before submitting.
                    </Text>

                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewTitle}>{values.name}</Text>
                      <Text style={styles.reviewDescription}>{values.description}</Text>
                      
                      <Text style={styles.reviewLabel}>Property Type</Text>
                      <Text style={styles.reviewValue}>
                        {propertyTypes.find(type => type.value === values.propertyType)?.label}
                      </Text>

                      <Text style={styles.reviewLabel}>Address</Text>
                      <Text style={styles.reviewValue}>
                        {values.address.street}, {values.address.city}, {values.address.state} {values.address.zipCode}, {values.address.country}
                      </Text>

                      <Text style={styles.reviewLabel}>Year Built</Text>
                      <Text style={styles.reviewValue}>{values.yearBuilt}</Text>

                      <Text style={styles.reviewLabel}>Total Units</Text>
                      <Text style={styles.reviewValue}>{values.totalUnits}</Text>

                      <Text style={styles.reviewLabel}>Amenities</Text>
                      <Text style={styles.reviewValue}>
                        {values.amenities.length > 0
                          ? values.amenities.map((amenity: string) =>
                              amenityOptions.find(option => option.value === amenity)?.label
                            ).join(', ')
                          : 'None specified'}
                      </Text>
                      
                      <Text style={styles.reviewLabel}>Images</Text>
                      <Text style={styles.reviewValue}>
                        {values.images.length} {values.images.length === 1 ? 'image' : 'images'} added
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                {currentStep > 0 && (
                  <Button
                    title="Back"
                    onPress={prevStep}
                    variant="secondary"
                    style={styles.footerButton}
                  />
                )}
                
                {currentStep < steps.length - 1 ? (
                  <Button
                    title="Next"
                    onPress={nextStep}
                    style={styles.footerButton}
                  />
                ) : (
                  <Button
                    title={isEditing ? 'Update Property' : 'Create Property'}
                    onPress={() => handleSubmit()}
                    loading={isLoading}
                    style={styles.footerButton}
                  />
                )}
              </View>
            </>
          );
        }}
      </Formik>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold as '700',
    marginBottom: SPACING.sm,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  stepContent: {
    paddingBottom: SPACING.xl,
  },
  stepTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
    marginBottom: SPACING.md,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium as '500',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -SPACING.xs / 2,
  },
  halfColumn: {
    flex: 1,
    paddingHorizontal: SPACING.xs / 2,
  },
  unitContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  unitTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium as '500',
    color: COLORS.text.primary,
  },
  removeButton: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium as '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: SPACING.xs / 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
  },
  aiButtonContainer: {
    marginBottom: SPACING.md,
  },
  aiSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewSection: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold as '700',
    marginBottom: SPACING.xs,
    color: COLORS.text.primary,
  },
  reviewDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  reviewLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium as '500',
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  reviewValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
});
