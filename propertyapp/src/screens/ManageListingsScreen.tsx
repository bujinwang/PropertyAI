import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Rental } from '../types/rental'; // Updated to use Rental type
import { rentalService } from '../services/rentalService'; // Updated to use rental service
import { RootStackParamList } from '../navigation/types';
import { StackScreenProps } from '@react-navigation/stack';
import { PropertyStackParamList } from '../navigation/PropertyStackNavigator';
import { useNavigation } from '@react-navigation/native';
import { AuthError, AuthErrorType } from '../services/api';

type ManageListingsScreenProps = StackScreenProps<PropertyStackParamList, 'PropertyList'>;

const ManageListingsScreen = ({ navigation }: ManageListingsScreenProps) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rootNavigation = useNavigation();

  useEffect(() => {
    console.log('Fetching rentals on mount');
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRentals = await rentalService.getRentals();
      setRentals(fetchedRentals);
      console.log('Fetched rentals:', fetchedRentals);
    } catch (err) {
      console.error('Failed to fetch rentals:', err);
      if (err instanceof AuthError && (err.type === AuthErrorType.EXPIRED_TOKEN || err.type === AuthErrorType.INVALID_REFRESH)) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          { text: 'OK', onPress: () => rootNavigation.navigate('Login') }
        ]);
      } else {
        setError('Failed to load rentals. Please try again later.');
        Alert.alert('Error', 'Failed to load rentals. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditRental = (rentalId: string) => {
    // Navigate to RentalFormScreen for editing
    navigation.navigate('RentalForm', { rentalId });
  };

  const handleAddRental = () => {
    // Navigate to RentalFormScreen for adding new rental
    navigation.navigate('RentalForm', {});
  };

  const renderRentalItem = ({ item }: { item: Rental }) => (
    <View style={styles.rentalItem}>
      <View style={styles.rentalHeader}>
        <Text style={styles.rentalTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.statusACTIVE : styles.statusINACTIVE]}>
          <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
        </View>
      </View>
      <Text style={styles.rentalDescription}>{item.description}</Text>
      <Text style={styles.rentalPrice}>${item.rent}/month</Text>
      <Text style={styles.rentalAddress}>{item.address}, {item.city}, {item.state}</Text>
      <Text style={styles.rentalInfo}>Type: {item.propertyType} • {item.bedrooms}BR/{item.bathrooms}BA</Text>
      <Text style={styles.availabilityInfo}>
        Available: {item.isAvailable ? 'Yes' : 'No'}
        {item.availableDate && ` (${new Date(item.availableDate).toLocaleDateString()})`}
      </Text>
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => handleEditRental(item.id)}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  console.log('Rendering ManageListingsScreen', {
    rentalsLength: rentals.length,
    loading,
    error
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading rentals...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRentals}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Rentals</Text>
      {/* Deprecation notice */}
      <View style={styles.deprecationNotice}>
        <Ionicons name="warning-outline" size={16} color="#f39c12" />
        <Text style={styles.deprecationText}>
          This screen has been updated to use the unified Rental model
        </Text>
      </View>
      
      {rentals.length === 0 ? (
        <View style={styles.centered}>
          <Text>No rentals found. Create your first rental!</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddRental}>
            <Ionicons name="add-circle-outline" size={30} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add New Rental</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={(item) => item.id}
          renderItem={renderRentalItem}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchRentals}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={handleAddRental}>
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
    marginBottom: 10,
    color: '#333',
  },
  deprecationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  deprecationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  rentalItem: {
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
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rentalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusACTIVE: {
    backgroundColor: '#27ae60',
  },
  statusINACTIVE: {
    backgroundColor: '#95a5a6',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rentalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rentalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 4,
  },
  rentalAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rentalInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  availabilityInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#27ae60',
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3498db',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ManageListingsScreen;
