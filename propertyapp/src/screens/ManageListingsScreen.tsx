import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../types/property'; // Import the Property type
import { propertyService } from '../services/propertyService'; // Import property service
import { RootStackParamList } from '../navigation/types'; // Import RootStackParamList
import { StackScreenProps } from '@react-navigation/stack'; // Import StackScreenProps
import { PropertyStackParamList } from '../navigation/PropertyStackNavigator'; // Import PropertyStackParamList

type ManageListingsScreenProps = StackScreenProps<PropertyStackParamList, 'PropertyList'>; // Use PropertyStackParamList

const ManageListingsScreen = ({ navigation }: ManageListingsScreenProps) => { // Use typed props
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Fetching properties on mount');
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProperties = await propertyService.getProperties();
      setProperties(fetchedProperties);
      console.log('Fetched properties:', fetchedProperties);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError('Failed to load properties. Please try again later.');
      Alert.alert('Error', 'Failed to load properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProperty = (propertyId: string) => {
    // Navigate to PropertyFormScreen for editing
    navigation.navigate({ name: 'PropertyForm', params: { propertyId } });
  };

  const handleAddProperty = () => {
    // Navigate to PropertyFormScreen for adding new property
    navigation.navigate({ name: 'PropertyForm', params: {} });
  };

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <View style={styles.propertyItem}>
      <Text style={styles.propertyTitle}>{item.title}</Text>
      <Text style={styles.propertyAddress}>{item.address}</Text>
      <Text style={styles.propertyType}>{item.propertyType}</Text>
      <Text style={styles.propertyPrice}>${item.price}/month</Text>
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => handleEditProperty(item.id)}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  console.log('Rendering ManageListingsScreen', {
    propertiesLength: properties.length,
    loading,
    error
  });
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading properties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProperties}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Listings</Text>
      {properties.length === 0 ? (
        <View style={styles.centered}>
          <Text>No properties found. Add your first property!</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
            <Ionicons name="add-circle-outline" size={30} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add New Property</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={handleAddProperty}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  propertyItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  propertyType: {
    fontSize: 14,
    color: '#666',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 5,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ManageListingsScreen;
