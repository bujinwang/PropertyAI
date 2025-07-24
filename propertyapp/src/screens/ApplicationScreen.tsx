import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useState } from 'react';
import { submitApplication } from '../services/applicationService';
import { Alert } from 'react-native';

type ApplicationNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ApplicationScreen: React.FC = () => {
  const navigation = useNavigation<ApplicationNavigationProp>();
  const route = useRoute();
  const { unitId } = route.params as { unitId: string };

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    creditScore: '',
    income: '',
    employmentStatus: '',
    rentalHistory: '',
    criminalHistory: '',
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Replace with actual applicantId and listingId
      const applicantId = 'user-1';
      const listingId = 'listing-1';

      await submitApplication({
        listingId,
        applicantId,
        screening: {
          creditScore: parseInt(formData.creditScore, 10),
          income: parseInt(formData.income, 10),
          employmentStatus: formData.employmentStatus,
          rentalHistory: formData.rentalHistory,
          criminalHistory: formData.criminalHistory,
        },
      });
      Alert.alert('Success', 'Application submitted successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Rental Application</Text>
          <Text style={styles.subtitle}>Unit {unitId}</Text>

          <Card style={styles.section}>
            <Card.Title title="Screening Information" />
            <Card.Content>
              <Input
                label="Credit Score"
                value={formData.creditScore}
                onChangeText={(value) => handleInputChange('creditScore', value)}
                keyboardType="number-pad"
              />
              <Input
                label="Monthly Income"
                value={formData.income}
                onChangeText={(value) => handleInputChange('income', value)}
                keyboardType="number-pad"
              />
              <Input
                label="Employment Status"
                value={formData.employmentStatus}
                onChangeText={(value) => handleInputChange('employmentStatus', value)}
              />
              <Input
                label="Rental History"
                value={formData.rentalHistory}
                onChangeText={(value) => handleInputChange('rentalHistory', value)}
                multiline
              />
              <Input
                label="Criminal History"
                value={formData.criminalHistory}
                onChangeText={(value) => handleInputChange('criminalHistory', value)}
                multiline
              />
            </Card.Content>
          </Card>

          <Button
            title={loading ? 'Submitting...' : 'Submit Application'}
            variant="primary"
            onPress={handleSubmit}
            style={styles.button}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  button: {
    marginTop: 20,
  },
});

export default ApplicationScreen;