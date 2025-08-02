import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { listingService, Listing } from '../services/listingService';

type EditListingScreenRouteProp = RouteProp<RootStackParamList, 'EditListing'>;
type EditListingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditListing'>;

type Props = {
  route: EditListingScreenRouteProp;
  navigation: EditListingScreenNavigationProp;
};

const EditListingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState('');
  const [availableDate, setAvailableDate] = useState('');
  const [leaseTerms, setLeaseTerms] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchListingDetails();
  }, [listingId]);

  const fetchListingDetails = async () => {
    try {
      setIsLoading(true);
      const listingData = await listingService.getListingById(listingId);
      setListing(listingData);
      setTitle(listingData.title);
      setDescription(listingData.description);
      setRent(listingData.rent.toString());
      setAvailableDate(listingData.availableDate);
      setLeaseTerms(listingData.leaseTerms || '');
    } catch (error) {
      console.error('Error fetching listing details:', error);
      Alert.alert('Error', 'Failed to load listing details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await listingService.updateListing(listingId, {
        title,
        description,
        rent: parseFloat(rent),
        availableDate,
        leaseTerms,
      });
      Alert.alert('Success', 'Listing updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving listing:', error);
      Alert.alert('Error', 'Failed to update listing');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading listing details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Listing</Text>
      
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter listing title"
      />
      
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter listing description"
        multiline
        numberOfLines={4}
      />
      
      <Text style={styles.label}>Monthly Rent ($)</Text>
      <TextInput
        style={styles.input}
        value={rent}
        onChangeText={setRent}
        placeholder="Enter monthly rent"
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Available Date</Text>
      <TextInput
        style={styles.input}
        value={availableDate}
        onChangeText={setAvailableDate}
        placeholder="YYYY-MM-DD"
      />
      
      <Text style={styles.label}>Lease Terms</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={leaseTerms}
        onChangeText={setLeaseTerms}
        placeholder="Enter lease terms and conditions"
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.buttonContainer}>
        <Button 
          title={isSaving ? "Saving..." : "Save Changes"} 
          onPress={handleSave}
          disabled={isSaving}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default EditListingScreen;
