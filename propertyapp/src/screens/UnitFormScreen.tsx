import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
import { RootStackParamList } from '@/navigation/types';
import { unitService } from '@/services/unitService';
import { CreateUnitRequest } from '@/types/unit';

type UnitFormScreenRouteProp = RouteProp<RootStackParamList, 'UnitForm'>;

interface UnitFormValues {
  unitNumber: string;
  floorNumber: string;
  size: string;
  bedrooms: string;
  bathrooms: string;
  rent: string;
  deposit: string;
  isAvailable: boolean;
  dateAvailable?: string;
  features: string;
}

const initialValues: UnitFormValues = {
  unitNumber: '',
  floorNumber: '',
  size: '',
  bedrooms: '1',
  bathrooms: '1',
  rent: '',
  deposit: '',
  isAvailable: true,
  dateAvailable: '',
  features: '',
};

const validationSchema = Yup.object().shape({
  unitNumber: Yup.string().required('Unit number is required'),
  floorNumber: Yup.number().nullable().min(1, 'Floor number must be at least 1'),
  size: Yup.number().nullable().positive('Size must be positive'),
  bedrooms: Yup.number().required('Bedrooms is required').min(0, 'Bedrooms cannot be negative'),
  bathrooms: Yup.number().required('Bathrooms is required').min(0.5, 'Bathrooms must be at least 0.5'),
  rent: Yup.number().required('Rent is required').positive('Rent must be positive'),
  deposit: Yup.number().nullable().positive('Deposit must be positive'),
});

const UnitFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<UnitFormScreenRouteProp>();
  const { propertyId, unitId } = route.params || {};
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: UnitFormValues) => {
    setLoading(true);
    try {
      const unitData: CreateUnitRequest = {
        unitNumber: values.unitNumber,
        floorNumber: values.floorNumber ? parseInt(values.floorNumber) : undefined,
        size: values.size ? parseFloat(values.size) : undefined,
        bedrooms: parseInt(values.bedrooms),
        bathrooms: parseFloat(values.bathrooms),
        rent: parseFloat(values.rent),
        deposit: values.deposit ? parseFloat(values.deposit) : undefined,
        isAvailable: values.isAvailable,
        dateAvailable: values.dateAvailable || undefined,
        features: values.features ? values.features.split(',').map(f => f.trim()) : [],
        propertyId: propertyId,
      };

      if (unitId) {
        // Update existing unit
        await unitService.updateUnit(unitId, unitData);
        Alert.alert('Success', 'Unit updated successfully');
      } else {
        // Create new unit
        await unitService.createUnit(unitData);
        Alert.alert('Success', 'Unit created successfully');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{unitId ? 'Edit Unit' : 'Add New Unit'}</Text>
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <TextInput
                label="Unit Number"
                value={values.unitNumber}
                onChangeText={handleChange('unitNumber')}
                onBlur={handleBlur('unitNumber')}
                error={touched.unitNumber && errors.unitNumber}
                placeholder="e.g., 101A"
              />

              <TextInput
                label="Floor Number"
                value={values.floorNumber}
                onChangeText={handleChange('floorNumber')}
                onBlur={handleBlur('floorNumber')}
                error={touched.floorNumber && errors.floorNumber}
                placeholder="e.g., 1"
                keyboardType="numeric"
              />

              <TextInput
                label="Size (sq ft)"
                value={values.size}
                onChangeText={handleChange('size')}
                onBlur={handleBlur('size')}
                error={touched.size && errors.size}
                placeholder="e.g., 750"
                keyboardType="numeric"
              />

              <TextInput
                label="Bedrooms"
                value={values.bedrooms}
                onChangeText={handleChange('bedrooms')}
                onBlur={handleBlur('bedrooms')}
                error={touched.bedrooms && errors.bedrooms}
                placeholder="e.g., 2"
                keyboardType="numeric"
              />

              <TextInput
                label="Bathrooms"
                value={values.bathrooms}
                onChangeText={handleChange('bathrooms')}
                onBlur={handleBlur('bathrooms')}
                error={touched.bathrooms && errors.bathrooms}
                placeholder="e.g., 1.5"
                keyboardType="decimal-pad"
              />

              <TextInput
                label="Monthly Rent ($)"
                value={values.rent}
                onChangeText={handleChange('rent')}
                onBlur={handleBlur('rent')}
                error={touched.rent && errors.rent}
                placeholder="e.g., 1200"
                keyboardType="numeric"
              />

              <TextInput
                label="Security Deposit ($)"
                value={values.deposit}
                onChangeText={handleChange('deposit')}
                onBlur={handleBlur('deposit')}
                error={touched.deposit && errors.deposit}
                placeholder="e.g., 1200"
                keyboardType="numeric"
              />

              <TextInput
                label="Available Date"
                value={values.dateAvailable}
                onChangeText={handleChange('dateAvailable')}
                onBlur={handleBlur('dateAvailable')}
                placeholder="YYYY-MM-DD"
              />

              <TextInput
                label="Features (comma-separated)"
                value={values.features}
                onChangeText={handleChange('features')}
                onBlur={handleBlur('features')}
                placeholder="e.g., balcony, dishwasher, parking"
                multiline
                style={styles.featuresInput}
              />

              <Button
                title={unitId ? 'Update Unit' : 'Create Unit'}
                onPress={handleSubmit as any}
                disabled={loading}
                style={styles.submitButton}
              />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  form: {
    gap: SPACING.md,
  },
  featuresInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
});

export default UnitFormScreen;