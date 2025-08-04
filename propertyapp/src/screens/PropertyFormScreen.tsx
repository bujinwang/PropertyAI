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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { ImagePickerMultiple } from '@/components/ui/ImagePickerMultiple';
import { SelectInput } from '@/components/ui/SelectInput';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { useAuth } from '@/contexts/AuthContext';
import { rentalService } from '@/services/rentalService';
import { aiService } from '@/services/aiService';
import { RootStackParamList } from '@/navigation/types';
import { Rental, PropertyType, RentalType, CreateRentalDto } from '@/types/rental';

type PropertyFormScreenRouteProp = RouteProp<RootStackParamList, 'PropertyForm'>;

interface PropertyFormValues {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: string;
  rentalType: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  rent: string;
  amenities: string[];
  yearBuilt: string;
  totalUnits: string;
  images: Array<{ uri: string; name: string; type: string }>;
}

const initialValues: PropertyFormValues = {
  title: '',
  description: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  propertyType: '',
  rentalType: 'LONG_TERM',
  bedrooms: '1',
  bathrooms: '1',
  size: '',
  rent: '',
  amenities: [],
  yearBuilt: '',
  totalUnits: '1',
  images: [],
};

const propertyTypes = [
  { label: 'Apartment', value: 'APARTMENT' },
  { label: 'House', value: 'HOUSE' },
  { label: 'Condo', value: 'CONDO' },
  { label: 'Townhouse', value: 'TOWNHOUSE' },
  { label: 'Commercial', value: 'COMMERCIAL' },
  { label: 'Other', value: 'OTHER' },
];

const rentalTypes = [
  { label: 'Long Term', value: 'LONG_TERM' },
  { label: 'Short Term', value: 'SHORT_TERM' },
  { label: 'Vacation Rental', value: 'VACATION' },
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
  title: Yup.string().required('Rental title is required'),
  description: Yup.string().required('Description is required'),
  address: Yup.string().required('Street address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zipCode: Yup.string().required('ZIP code is required'),
  country: Yup.string().required('Country is required'),
  propertyType: Yup.string().required('Rental type is required'),
  rentalType: Yup.string().required('Rental type is required'),
  bedrooms: Yup.string().required('Number of bedrooms is required'),
  bathrooms: Yup.string().required('Number of bathrooms is required'),
  size: Yup.string().required('Size is required'),
  rent: Yup.string().required('Rent amount is required'),
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
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [property, setProperty] = useState<PropertyFormValues>(initialValues);
  const [isDataLoaded, setIsDataLoaded] = useState(!isEditing);

  const steps = [
    'Basic Info',
    'Address',
    'Details',
    'Images & AI',
    'Review',
  ];

  useEffect(() => {
    console.log('PropertyFormScreen mounted. Property ID:', propertyId);
    if (isEditing) {
      fetchRentalDetails();
    }
  }, [propertyId]);

  const fetchRentalDetails = async () => {
    if (!propertyId) return;
    
    try {
      setIsLoading(true);
      const rentalData = await rentalService.getRentalById(propertyId);
      console.log('Fetched rental data:', rentalData);
      
      // Map API response to form values
      const newPropertyState: PropertyFormValues = {
        title: rentalData.title || '',
        description: rentalData.description || '',
        address: rentalData.address || '',
        city: rentalData.city || '',
        state: rentalData.state || '',
        zipCode: rentalData.zipCode || '',
        country: rentalData.country || 'US',
        propertyType: rentalData.propertyType || '',
        rentalType: rentalData.rentalType || 'LONG_TERM',
        bedrooms: rentalData.bedrooms?.toString() || '1',
        bathrooms: rentalData.bathrooms?.toString() || '1',
        size: rentalData.size?.toString() || '',
        rent: rentalData.rent?.toString() || '',
        amenities: Array.isArray(rentalData.amenities) ? rentalData.amenities : [],
        yearBuilt: rentalData.yearBuilt?.toString() || '',
        totalUnits: rentalData.totalUnits?.toString() || '1',
        images: rentalData.images?.map((img) => ({
          uri: img.url || '',
          name: img.filename || 'rental-image.jpg',
          type: 'image/jpeg'
        })) || [],
      };
      setProperty(newPropertyState);
      setIsDataLoaded(true);
      console.log('Set property state to:', newPropertyState);
    } catch (error) {
      console.error('Error fetching rental details:', error);
      Alert.alert('Error', 'Failed to load rental details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: PropertyFormValues) => {
    setIsSubmitting(true);
    try {
      const submissionData: CreateRentalDto = {
        title: values.title,
        description: values.description,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
        propertyType: values.propertyType as PropertyType,
        rentalType: values.rentalType as RentalType,
        bedrooms: parseInt(values.bedrooms, 10),
        bathrooms: parseFloat(values.bathrooms),
        size: parseInt(values.size, 10),
        rent: parseFloat(values.rent),
        amenities: values.amenities,
        yearBuilt: parseInt(values.yearBuilt, 10),
        totalUnits: parseInt(values.totalUnits, 10),
        images: values.images.map((image, index) => ({
          url: image.uri,
          filename: image.name,
          isFeatured: index === 0,
        })),
      };

      let response: Rental;
      if (isEditing) {
        response = await rentalService.updateRental(propertyId, submissionData);
      } else {
        response = await rentalService.createRental(submissionData);
      }
      console.log('API response:', response);
      Alert.alert(
        isEditing ? 'Rental Updated' : 'Rental Created',
        isEditing ? 'Your rental has been successfully updated.' : 'Your new rental has been successfully created.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (isEditing) {
                navigation.goBack();
              } else {
                navigation.navigate('RentalDetail', { rentalId: response.id });
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting rental:', error);
      Alert.alert('Error', 'There was an error submitting the rental. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIDescription = async (values: PropertyFormValues, setFieldValue: FormikProps<PropertyFormValues>['setFieldValue']) => {
    if (values.images.length === 0) {
      Alert.alert('Error', 'Please upload at least one image to generate description');
      return;
    }

    try {
      setIsAiGenerating(true);
      
      const propertyDetails = {
        propertyType: values.propertyType,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        amenities: values.amenities,
        images: values.images
      };

      const response = await aiService.generatePropertyDescription(propertyId || 'new', propertyDetails);
      setFieldValue('description', response.description);
      setIsAiGenerating(false);
      Alert.alert(
        'AI Description Generated',
        response.description,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error generating AI description:', error);
      Alert.alert('Error', 'Failed to generate AI description');
      setIsAiGenerating(false);
    }
  };

  const getPricingRecommendation = async (values: PropertyFormValues, setFieldValue: FormikProps<PropertyFormValues>['setFieldValue']) => {
    try {
      setIsPricingLoading(true);
      
      const propertyDetails = {
        address: {
          street: values.address,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
        },
        propertyType: values.propertyType,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        squareFeet: values.size,
        amenities: values.amenities,
        yearBuilt: values.yearBuilt
      };

      const response = await aiService.generatePricingRecommendations(propertyDetails);
      
      Alert.alert(
        'Pricing Recommendation Generated', 
        `Recommended Monthly Rent: $${response.recommendedPrice}\n\nPrice Range: $${response.priceRange.min} - $${response.priceRange.max}\n\nMarket Analysis: ${response.marketAnalysis || 'Based on current market conditions'}\n\nConfidence: ${response.confidence || 'High'}`
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

  // Add loading state check
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading rental details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Remove the deprecation notice since this form already works with the unified rental model */}

      <Formik
        initialValues={property}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }: FormikProps<PropertyFormValues>) => {
          const stateLabel = values.country === 'Canada' ? 'Province' : 'State';
          return (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {isEditing ? 'Edit Rental' : 'Add New Rental'}
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
                      label="Rental Title"
                      value={values.title}
                      onChangeText={handleChange('title')}
                      onBlur={handleBlur('title')}
                      error={touched.title ? errors.title : undefined}
                      placeholder="Enter a title for your rental"
                    />

                    <TextInput
                      label="Description"
                      value={values.description}
                      onChangeText={handleChange('description')}
                      onBlur={handleBlur('description')}
                      error={touched.description ? errors.description : undefined}
                      placeholder="Describe your rental (or leave empty for AI generation later)"
                      multiline
                      numberOfLines={4}
                    />

                    <SelectInput
                      label="Rental Type"
                      value={values.propertyType}
                      onChange={(value: string | number) => setFieldValue('propertyType', value)}
                      options={propertyTypes}
                      error={touched.propertyType ? errors.propertyType : undefined}
                    />

                    <SelectInput
                      label="Rental Type"
                      value={values.rentalType}
                      onChange={(value: string | number) => setFieldValue('rentalType', value)}
                      options={rentalTypes}
                      error={touched.rentalType ? errors.rentalType : undefined}
                    />

                    <TextInput
                      label="Total Units"
                      value={values.totalUnits}
                      onChangeText={handleChange('totalUnits')}
                      onBlur={handleBlur('totalUnits')}
                      error={touched.totalUnits ? errors.totalUnits : undefined}
                      placeholder="Total number of units in the rental"
                      keyboardType="numeric"
                    />
                  </View>
                )}

                {currentStep === 1 && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Rental Address</Text>
                    
                    <TextInput
                      label="Street Address"
                      value={values.address}
                      onChangeText={handleChange('address')}
                      onBlur={handleBlur('address')}
                      error={touched.address ? errors.address : undefined}
                      placeholder="Enter street address"
                    />

                    <TextInput
                      label="City"
                      value={values.city}
                      onChangeText={handleChange('city')}
                      onBlur={handleBlur('city')}
                      error={touched.city ? errors.city : undefined}
                      placeholder="Enter city"
                    />

                    <View style={styles.row}>
                      <View style={styles.halfColumn}>
                        <TextInput
                          label={stateLabel}
                          value={values.state}
                          onChangeText={handleChange('state')}
                          onBlur={handleBlur('state')}
                          error={touched.state ? errors.state : undefined}
                          placeholder={stateLabel}
                        />
                      </View>
                      
                      <View style={styles.halfColumn}>
                        <TextInput
                          label="ZIP Code"
                          value={values.zipCode}
                          onChangeText={handleChange('zipCode')}
                          onBlur={handleBlur('zipCode')}
                          error={touched.zipCode ? errors.zipCode : undefined}
                          placeholder="ZIP Code"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <SelectInput
                      label="Country"
                      value={values.country}
                      onChange={(value) => {
                        setFieldValue('country', value);
                      }}
                      options={[
                        { label: 'United States', value: 'USA' },
                        { label: 'Canada', value: 'CA' },
                      ]}
                      error={touched.country ? errors.country : undefined}
                    />
                  </View>
                )}

                {currentStep === 2 && (
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Rental Details</Text>
                    
                    <View style={styles.row}>
                      <View style={styles.halfColumn}>
                        <TextInput
                          label="Bedrooms"
                          value={values.bedrooms}
                          onChangeText={handleChange('bedrooms')}
                          onBlur={handleBlur('bedrooms')}
                          error={touched.bedrooms ? errors.bedrooms : undefined}
                          placeholder="Number of bedrooms"
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.halfColumn}>
                        <TextInput
                          label="Bathrooms"
                          value={values.bathrooms}
                          onChangeText={handleChange('bathrooms')}
                          onBlur={handleBlur('bathrooms')}
                          error={touched.bathrooms ? errors.bathrooms : undefined}
                          placeholder="Number of bathrooms"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.row}>
                      <View style={styles.halfColumn}>
                        <TextInput
                          label="Size (sq ft)"
                          value={values.size}
                          onChangeText={handleChange('size')}
                          onBlur={handleBlur('size')}
                          error={touched.size ? errors.size : undefined}
                          placeholder="Square footage"
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.halfColumn}>
                        <TextInput
                          label="Monthly Rent ($)"
                          value={values.rent}
                          onChangeText={handleChange('rent')}
                          onBlur={handleBlur('rent')}
                          error={touched.rent ? errors.rent : undefined}
                          placeholder="Monthly rent amount"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

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
                    <Text style={styles.stepTitle}>Rental Images & AI Features</Text>
                    <Text style={styles.subtitle}>
                      Add images of your rental and use AI to enhance your listing.
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
                            Generate a compelling rental description based on your rental details and images.
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
                            Get market-based pricing recommendations for your rental.
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
                    <Text style={styles.stepTitle}>Review Rental</Text>
                    <Text style={styles.subtitle}>
                      Please review the details of your rental listing before submitting.
                    </Text>

                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewTitle}>{values.title}</Text>
                      <Text style={styles.reviewLabel}>Description</Text>
                      <Text style={styles.reviewDescription}>{values.description}</Text>
                      
                      <Text style={styles.reviewLabel}>Rental Type</Text>
                      <Text style={styles.reviewValue}>
                        {propertyTypes.find(type => type.value === values.propertyType)?.label}
                      </Text>

                      <Text style={styles.reviewLabel}>Rental Type</Text>
                      <Text style={styles.reviewValue}>
                        {rentalTypes.find(type => type.value === values.rentalType)?.label}
                      </Text>

                      <Text style={styles.reviewLabel}>Address</Text>
                      <Text style={styles.reviewValue}>
                        {values.address}, {values.city}, {values.state} {values.zipCode}, {values.country}
                      </Text>

                      <Text style={styles.reviewLabel}>Bedrooms / Bathrooms</Text>
                      <Text style={styles.reviewValue}>{values.bedrooms} bed / {values.bathrooms} bath</Text>

                      <Text style={styles.reviewLabel}>Size</Text>
                      <Text style={styles.reviewValue}>{values.size} sq ft</Text>

                      <Text style={styles.reviewLabel}>Monthly Rent</Text>
                      <Text style={styles.reviewValue}>${values.rent}</Text>

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
                    title={isEditing ? 'Update Rental' : 'Create Rental'}
                    onPress={() => handleSubmit()}
                    loading={isSubmitting}
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
  deprecationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    gap: 8,
  },
  deprecationText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
  },
  deprecationLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
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
