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
import { RootStackParamList } from '@/navigation/types';

type PropertyFormScreenRouteProp = RouteProp<RootStackParamList, 'PropertyForm'>;

interface Unit {
  unitNumber: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  price: string;
}

interface PropertyFormValues {
  title: string;
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
  price: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  yearBuilt: string;
  images: Array<{ uri: string; name: string; type: string }>;
  units: Array<Unit>;
}

const initialValues: PropertyFormValues = {
  title: '',
  description: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  },
  propertyType: 'apartment',
  amenities: [],
  price: '',
  bedrooms: '1',
  bathrooms: '1',
  squareFeet: '',
  yearBuilt: '',
  images: [],
  units: [],
};

const propertyTypes = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Multi-family', value: 'multifamily' },
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
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  address: Yup.object().shape({
    street: Yup.string().required('Street address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    zipCode: Yup.string().required('ZIP code is required'),
    country: Yup.string().required('Country is required'),
  }),
  propertyType: Yup.string().required('Property type is required'),
  price: Yup.string().required('Price is required'),
  bedrooms: Yup.string().required('Number of bedrooms is required'),
  bathrooms: Yup.string().required('Number of bathrooms is required'),
  squareFeet: Yup.string().required('Square footage is required'),
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
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [property, setProperty] = useState<PropertyFormValues>(initialValues);

  const steps = [
    'Basic Info',
    'Address',
    'Features',
    'Units',
    'Images',
    'Review',
  ];

  useEffect(() => {
    if (isEditing) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;
    
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await propertyService.getPropertyById(propertyId);
      // setProperty(response.data);
      
      // Mock data for development
      setTimeout(() => {
        setProperty({
          ...initialValues,
          title: 'Luxury Downtown Apartment',
          description: 'Beautiful apartment in the heart of downtown',
          propertyType: 'apartment',
          price: '2000',
          bedrooms: '2',
          bathrooms: '2',
          squareFeet: '1200',
          yearBuilt: '2015',
          amenities: ['airConditioning', 'parking', 'gym'],
          address: {
            street: '123 Main St',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            country: 'United States',
          },
          images: [
            { 
              uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
              name: 'apartment-1.jpg',
              type: 'image/jpeg'
            }
          ],
          units: [
            {
              unitNumber: '101',
              bedrooms: '2',
              bathrooms: '2',
              squareFeet: '1200',
              price: '2000',
            }
          ]
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching property details:', error);
      Alert.alert('Error', 'Failed to load property details');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: PropertyFormValues) => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      // if (isEditing) {
      //   await propertyService.updateProperty(propertyId, values);
      // } else {
      //   await propertyService.createProperty(values);
      // }
      
      // Mock API call
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          'Success',
          isEditing ? 'Property updated successfully' : 'Property created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to save property');
      setIsLoading(false);
    }
  };

  const generateAIDescription = async (values: PropertyFormValues) => {
    if (values.images.length === 0) {
      Alert.alert('Error', 'Please upload at least one image to generate description');
      return;
    }

    try {
      setIsAiGenerating(true);
      
      // TODO: Replace with actual AI API call
      // const response = await aiService.generatePropertyDescription({
      //   propertyType: values.propertyType,
      //   bedrooms: values.bedrooms,
      //   bathrooms: values.bathrooms,
      //   amenities: values.amenities,
      //   images: values.images
      // });
      
      // Mock AI generation
      setTimeout(() => {
        const generatedDescription = `Stunning ${values.bedrooms}-bedroom, ${values.bathrooms}-bathroom ${values.propertyType} featuring ${values.amenities.slice(0, 3).join(', ')} and more. This beautiful property offers ${values.squareFeet} sq ft of living space in a prime location. Perfect for comfortable modern living with easy access to local amenities.`;
        
        values.description = generatedDescription;
        setIsAiGenerating(false);
        Alert.alert('Success', 'AI-generated description has been added');
      }, 2000);
    } catch (error) {
      console.error('Error generating AI description:', error);
      Alert.alert('Error', 'Failed to generate AI description');
      setIsAiGenerating(false);
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
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }: FormikProps<PropertyFormValues>) => (
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
                    label="Property Title"
                    value={values.title}
                    onChangeText={handleChange('title')}
                    onBlur={handleBlur('title')}
                    error={touched.title ? errors.title : undefined}
                    placeholder="Enter a catchy title for your property"
                  />

                  <TextInput
                    label="Description"
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    error={touched.description ? errors.description : undefined}
                    placeholder="Describe your property"
                    multiline
                    numberOfLines={4}
                  />

                  <View style={styles.aiButtonContainer}>
                    <Button 
                      title="Generate AI Description" 
                      onPress={() => generateAIDescription(values)}
                      isLoading={isAiGenerating}
                      type="secondary"
                      icon="sparkles"
                    />
                  </View>

                  <SelectInput
                    label="Property Type"
                    value={values.propertyType}
                    onValueChange={(value: string) => setFieldValue('propertyType', value)}
                    options={propertyTypes}
                    error={touched.propertyType ? errors.propertyType : undefined}
                  />

                  <TextInput
                    label="Price"
                    value={values.price}
                    onChangeText={handleChange('price')}
                    onBlur={handleBlur('price')}
                    error={touched.price ? errors.price : undefined}
                    placeholder="Monthly rent amount"
                    keyboardType="numeric"
                    leftIcon="dollar-sign"
                  />

                  <View style={styles.aiButtonContainer}>
                    <Button
                      title="Get Pricing Recommendation"
                      onPress={() => {
                        // TODO: Implement actual pricing recommendation API call
                        Alert.alert('Pricing Recommendation', 'Based on market data, we recommend a price of $2100/month.');
                      }}
                      type="secondary"
                      icon="trending-up"
                    />
                  </View>
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
                        label="State"
                        value={values.address.state}
                        onChangeText={handleChange('address.state')}
                        onBlur={handleBlur('address.state')}
                        error={touched.address?.state ? errors.address?.state : undefined}
                        placeholder="State"
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

                  <TextInput
                    label="Country"
                    value={values.address.country}
                    onChangeText={handleChange('address.country')}
                    onBlur={handleBlur('address.country')}
                    error={touched.address?.country ? errors.address?.country : undefined}
                    placeholder="Country"
                  />
                </View>
              )}

              {currentStep === 2 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Property Features</Text>
                  
                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <TextInput
                        label="Bedrooms"
                        value={values.bedrooms}
                        onChangeText={handleChange('bedrooms')}
                        onBlur={handleBlur('bedrooms')}
                        error={touched.bedrooms ? errors.bedrooms : undefined}
                        placeholder="Bedrooms"
                        keyboardType="numeric"
                        leftIcon="bed"
                      />
                    </View>
                    
                    <View style={styles.halfColumn}>
                      <TextInput
                        label="Bathrooms"
                        value={values.bathrooms}
                        onChangeText={handleChange('bathrooms')}
                        onBlur={handleBlur('bathrooms')}
                        error={touched.bathrooms ? errors.bathrooms : undefined}
                        placeholder="Bathrooms"
                        keyboardType="numeric"
                        leftIcon="droplet"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <TextInput
                        label="Square Feet"
                        value={values.squareFeet}
                        onChangeText={handleChange('squareFeet')}
                        onBlur={handleBlur('squareFeet')}
                        error={touched.squareFeet ? errors.squareFeet : undefined}
                        placeholder="Square Feet"
                        keyboardType="numeric"
                        leftIcon="square"
                      />
                    </View>
                    
                    <View style={styles.halfColumn}>
                      <TextInput
                        label="Year Built"
                        value={values.yearBuilt}
                        onChangeText={handleChange('yearBuilt')}
                        onBlur={handleBlur('yearBuilt')}
                        error={touched.yearBuilt ? errors.yearBuilt : undefined}
                        placeholder="Year Built"
                        keyboardType="numeric"
                        leftIcon="calendar"
                      />
                    </View>
                  </View>

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
                  <Text style={styles.stepTitle}>Units</Text>
                  <Text style={styles.subtitle}>
                    Add units for multi-unit properties. For single-unit properties, you can skip this step.
                  </Text>

                  {values.units.map((unit: Unit, index: number) => (
                    <View key={index} style={styles.unitContainer}>
                      <View style={styles.unitHeader}>
                        <Text style={styles.unitTitle}>Unit {index + 1}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const updatedUnits = [...values.units];
                            updatedUnits.splice(index, 1);
                            setFieldValue('units', updatedUnits);
                          }}
                        >
                          <Text style={styles.removeButton}>Remove</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        label="Unit Number"
                        value={unit.unitNumber}
                        onChangeText={(text: string) => {
                          const updatedUnits = [...values.units];
                          updatedUnits[index].unitNumber = text;
                          setFieldValue('units', updatedUnits);
                        }}
                        placeholder="Unit Number"
                      />

                      <View style={styles.row}>
                        <View style={styles.halfColumn}>
                          <TextInput
                            label="Bedrooms"
                            value={unit.bedrooms}
                            onChangeText={(text: string) => {
                              const updatedUnits = [...values.units];
                              updatedUnits[index].bedrooms = text;
                              setFieldValue('units', updatedUnits);
                            }}
                            placeholder="Bedrooms"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.halfColumn}>
                          <TextInput
                            label="Bathrooms"
                            value={unit.bathrooms}
                            onChangeText={(text: string) => {
                              const updatedUnits = [...values.units];
                              updatedUnits[index].bathrooms = text;
                              setFieldValue('units', updatedUnits);
                            }}
                            placeholder="Bathrooms"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.halfColumn}>
                          <TextInput
                            label="Square Feet"
                            value={unit.squareFeet}
                            onChangeText={(text: string) => {
                              const updatedUnits = [...values.units];
                              updatedUnits[index].squareFeet = text;
                              setFieldValue('units', updatedUnits);
                            }}
                            placeholder="Square Feet"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.halfColumn}>
                          <TextInput
                            label="Price"
                            value={unit.price}
                            onChangeText={(text: string) => {
                              const updatedUnits = [...values.units];
                              updatedUnits[index].price = text;
                              setFieldValue('units', updatedUnits);
                            }}
                            placeholder="Monthly Rent"
                            keyboardType="numeric"
                            leftIcon="dollar-sign"
                          />
                        </View>
                      </View>
                    </View>
                  ))}

                  <Button
                    title="Add Unit"
                    onPress={() => {
                      const newUnit: Unit = {
                        unitNumber: '',
                        bedrooms: '1',
                        bathrooms: '1',
                        squareFeet: '',
                        price: '',
                      };
                      setFieldValue('units', [...values.units, newUnit]);
                    }}
                    type="secondary"
                    icon="plus"
                  />
                </View>
              )}

              {currentStep === 4 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Property Images</Text>
                  <Text style={styles.subtitle}>
                    Upload high-quality photos of your property. You can add up to 10 images.
                  </Text>

                  <ImagePickerMultiple
                    images={values.images}
                    onChange={(images: Array<{ uri: string; name: string; type: string }>) => setFieldValue('images', images)}
                    maxImages={10}
                    error={touched.images ? (errors.images as string) : undefined}
                  />
                </View>
              )}

              {currentStep === 5 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Review Property</Text>
                  <Text style={styles.subtitle}>
                    Please review the details of your property listing before submitting.
                  </Text>

                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>{values.title}</Text>
                    <Text style={styles.reviewDescription}>{values.description}</Text>
                    
                    <Text style={styles.reviewLabel}>Property Type</Text>
                    <Text style={styles.reviewValue}>
                      {propertyTypes.find(type => type.value === values.propertyType)?.label}
                    </Text>

                    <Text style={styles.reviewLabel}>Price</Text>
                    <Text style={styles.reviewValue}>${values.price} per month</Text>

                    <Text style={styles.reviewLabel}>Address</Text>
                    <Text style={styles.reviewValue}>
                      {values.address.street}, {values.address.city}, {values.address.state} {values.address.zipCode}, {values.address.country}
                    </Text>

                    <Text style={styles.reviewLabel}>Features</Text>
                    <Text style={styles.reviewValue}>
                      {values.bedrooms} bed · {values.bathrooms} bath · {values.squareFeet} sq ft · Built in {values.yearBuilt}
                    </Text>

                    <Text style={styles.reviewLabel}>Amenities</Text>
                    <Text style={styles.reviewValue}>
                      {values.amenities.length > 0 
                        ? values.amenities.map((amenity: string) => 
                            amenityOptions.find(option => option.value === amenity)?.label
                          ).join(', ')
                        : 'None specified'}
                    </Text>

                    {values.units.length > 0 && (
                      <>
                        <Text style={styles.reviewLabel}>Units</Text>
                        {values.units.map((unit: Unit, index: number) => (
                          <Text key={index} style={styles.reviewValue}>
                            Unit {unit.unitNumber}: {unit.bedrooms} bed · {unit.bathrooms} bath · ${unit.price}/month
                          </Text>
                        ))}
                      </>
                    )}
                    
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
                  type="secondary"
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
                  isLoading={isLoading}
                  style={styles.footerButton}
                />
              )}
            </View>
          </>
        )}
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
