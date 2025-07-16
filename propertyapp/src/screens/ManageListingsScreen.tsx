import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../types/listing'; // Import the Listing type
import { listingService } from '../services/listingService'; // Import listing service
import { RootStackParamList } from '../navigation/types'; // Import RootStackParamList
import { StackScreenProps } from '@react-navigation/stack'; // Import StackScreenProps
import { PropertyStackParamList } from '../navigation/PropertyStackNavigator'; // Import PropertyStackParamList

type ManageListingsScreenProps = StackScreenProps<PropertyStackParamList, 'PropertyList'>; // Use PropertyStackParamList

const ManageListingsScreen = ({ navigation }: ManageListingsScreenProps) => { // Use typed props
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Fetching listings on mount');
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedListings = await listingService.getListings();
      setListings(fetchedListings);
      console.log('Fetched listings:', fetchedListings);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError('Failed to load listings. Please try again later.');
      Alert.alert('Error', 'Failed to load listings. Please try again later.');
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

  const renderListingItem = ({ item }: { item: Listing }) => (
    <View style={styles.propertyItem}>
      <View style={styles.listingHeader}>
        <Text style={styles.propertyTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.propertyDescription}>{item.description}</Text>
      <Text style={styles.propertyPrice}>${item.price.toLocaleString()}</Text>
      {item.property && (
        <Text style={styles.propertyAddress}>{item.property.address}</Text>
      )}
      {item.unit && (
        <Text style={styles.unitInfo}>
          Unit {item.unit.unitNumber} • {item.unit.bedrooms}BR/{item.unit.bathrooms}BA
        </Text>
      )}
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => handleEditProperty(item.id)}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  console.log('Rendering ManageListingsScreen', {
    listingsLength: listings.length,
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchListings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Listings</Text>
      {listings.length === 0 ? (
        <View style={styles.centered}>
          <Text>No listings found. Create your first listing!</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
            <Ionicons name="add-circle-outline" size={30} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add New Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchListings}
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
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  propertyItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDRAFT: {
    backgroundColor: '#95a5a6',
  },
  statusACTIVE: {
    backgroundColor: '#27ae60',
  },
  statusINACTIVE: {
    backgroundColor: '#e67e22',
  },
  statusEXPIRED: {
    backgroundColor: '#e74c3c',
  },
  statusRENTED: {
    backgroundColor: '#8e44ad',
  },
  propertyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 8,
  },
  unitInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
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
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ManageListingsScreen;
