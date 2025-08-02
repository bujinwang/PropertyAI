import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, SafeAreaView } from 'react-native';
import { getPublicListings } from '../services/api';
import { Property } from '../types/property';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { debounce } from 'lodash';
import { shadows } from '../utils/shadows';
import { Ionicons } from '@expo/vector-icons';

type PublicListingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PublicListing'
>;

type PublicListingScreenRouteProp = RouteProp<RootStackParamList, 'PublicListing'>;

type Props = {
  navigation: PublicListingScreenNavigationProp;
  route: PublicListingScreenRouteProp;
};

const PublicListingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { listingId } = route.params || {};
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchListings = async (query = '') => {
    setLoading(true);
    try {
      const data = await getPublicListings(query);
      setListings(data);
    } catch (error) {
      console.error('Error fetching public listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const debouncedSearch = useCallback(debounce(fetchListings, 500), []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const renderHeader = () => (
    <View>
      {/* Auth Header */}
      <View style={styles.authHeader}>
        <Text style={styles.appTitle}>PropertyAI</Text>
        <View style={styles.authButtons}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Container */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by address, city, or state..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.id })}
    >
      <Image source={{ uri: item.photos[0] }} style={styles.thumbnail} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.address}</Text>
        <Text>{`$${item.rent} / month`}</Text>
        <Text>{`${item.bedrooms} beds / ${item.bathrooms} baths`}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={listings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.container}
        ListHeaderComponent={renderHeader}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    padding: 10,
  },
  authHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  loginButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  registerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  searchInput: {
    height: 44,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    ...shadows.medium,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  textContainer: {
    marginLeft: 15,
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default PublicListingScreen;
