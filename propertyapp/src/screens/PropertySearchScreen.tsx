import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type PropertySearchScreenProps = NavigationProps<'PropertyList'>;

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  distance: number;
  available: boolean;
  amenities: string[];
  propertyType: string;
}

interface SearchFilters {
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  minSqft: number;
  maxSqft: number;
  amenities: string[];
  sortBy: 'price-low' | 'price-high' | 'newest' | 'distance';
}

const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Apartment',
    address: '123 Main St, Downtown',
    price: 1850,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    image: 'apartment1.jpg',
    distance: 0.5,
    available: true,
    amenities: ['Parking', 'Gym', 'Pool'],
    propertyType: 'Apartment',
  },
  {
    id: '2',
    title: 'Cozy Studio Near Campus',
    address: '456 University Ave',
    price: 1200,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 450,
    image: 'studio1.jpg',
    distance: 1.2,
    available: true,
    amenities: ['Laundry', 'WiFi'],
    propertyType: 'Studio',
  },
  {
    id: '3',
    title: 'Spacious Family Home',
    address: '789 Suburban Rd',
    price: 2500,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    image: 'house1.jpg',
    distance: 3.5,
    available: false,
    amenities: ['Garage', 'Garden', 'Pet Friendly'],
    propertyType: 'House',
  },
];

const propertyTypes = ['All', 'Apartment', 'House', 'Studio', 'Condo', 'Townhouse'];
const amenityOptions = ['Parking', 'Gym', 'Pool', 'Laundry', 'Pet Friendly', 'WiFi', 'Balcony'];

export function PropertySearchScreen({ navigation }: PropertySearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(mockProperties);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minPrice: 0,
    maxPrice: 5000,
    bedrooms: 0,
    bathrooms: 0,
    propertyType: 'All',
    minSqft: 0,
    maxSqft: 3000,
    amenities: [],
    sortBy: 'price-low',
  });

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, filters, properties]);

  const applyFiltersAndSearch = () => {
    const filtered = properties.filter(property => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = property.title.toLowerCase().includes(query);
        const matchesAddress = property.address.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAddress) return false;
      }

      // Price filter
      if (property.price < filters.minPrice || property.price > filters.maxPrice) return false;

      // Bedrooms filter
      if (filters.bedrooms > 0 && property.bedrooms < filters.bedrooms) return false;

      // Bathrooms filter
      if (filters.bathrooms > 0 && property.bathrooms < filters.bathrooms) return false;

      // Property type filter
      if (filters.propertyType !== 'All' && property.propertyType !== filters.propertyType) return false;

      // Square footage filter
      if (property.sqft < filters.minSqft || property.sqft > filters.maxSqft) return false;

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity =>
          property.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'distance':
          return a.distance - b.distance;
        case 'newest':
          return b.id.localeCompare(a.id); // Mock newest by ID
        default:
          return 0;
      }
    });

    setFilteredProperties(filtered);
  };

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 5000,
      bedrooms: 0,
      bathrooms: 0,
      propertyType: 'All',
      minSqft: 0,
      maxSqft: 3000,
      amenities: [],
      sortBy: 'price-low',
    });
    setSearchQuery('');
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(item)}
    >
      <View style={styles.propertyImage}>
        <Text style={styles.imagePlaceholder}>🏠</Text>
        {!item.available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.address}
        </Text>

        <View style={styles.propertyDetails}>
          <Text style={styles.propertyPrice}>${item.price}/month</Text>
          <Text style={styles.propertySpecs}>
            {item.bedrooms} bed • {item.bathrooms} bath • {item.sqft} sqft
          </Text>
        </View>

        <View style={styles.propertyMeta}>
          <Text style={styles.distanceText}>{item.distance} miles away</Text>
          <View style={styles.amenitiesPreview}>
            {item.amenities.slice(0, 2).map((amenity, index) => (
              <Text key={index} style={styles.amenityTag}>
                {amenity}
              </Text>
            ))}
            {item.amenities.length > 2 && (
              <Text style={styles.moreAmenities}>+{item.amenities.length - 2}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Price Range</Text>
        <View style={styles.priceInputs}>
          <TextInput
            style={styles.priceInput}
            placeholder="$ Min"
            keyboardType="numeric"
            value={filters.minPrice.toString()}
            onChangeText={(value) => setFilters(prev => ({ ...prev, minPrice: parseInt(value) || 0 }))}
          />
          <Text style={styles.priceSeparator}>-</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="$ Max"
            keyboardType="numeric"
            value={filters.maxPrice.toString()}
            onChangeText={(value) => setFilters(prev => ({ ...prev, maxPrice: parseInt(value) || 5000 }))}
          />
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Property Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {propertyTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                filters.propertyType === type && styles.selectedType,
              ]}
              onPress={() => setFilters(prev => ({ ...prev, propertyType: type }))}
            >
              <Text
                style={[
                  styles.typeText,
                  filters.propertyType === type && styles.selectedTypeText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Bedrooms & Bathrooms</Text>
        <View style={styles.roomInputs}>
          <View style={styles.roomInput}>
            <Text style={styles.roomLabel}>Beds</Text>
            <TextInput
              style={styles.roomTextInput}
              keyboardType="numeric"
              value={filters.bedrooms.toString()}
              onChangeText={(value) => setFilters(prev => ({ ...prev, bedrooms: parseInt(value) || 0 }))}
            />
          </View>
          <View style={styles.roomInput}>
            <Text style={styles.roomLabel}>Baths</Text>
            <TextInput
              style={styles.roomTextInput}
              keyboardType="numeric"
              value={filters.bathrooms.toString()}
              onChangeText={(value) => setFilters(prev => ({ ...prev, bathrooms: parseInt(value) || 0 }))}
            />
          </View>
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {amenityOptions.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.amenityButton,
                filters.amenities.includes(amenity) && styles.selectedAmenity,
              ]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Text
                style={[
                  styles.amenityText,
                  filters.amenities.includes(amenity) && styles.selectedAmenityText,
                ]}
              >
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
        <Text style={styles.clearFiltersText}>Clear All Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, property name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && renderFilters()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredProperties.length} properties found
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort by: Price</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.propertyList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 20,
    color: '#fff',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  typeScroll: {
    marginBottom: 8,
  },
  typeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedType: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  typeText: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectedTypeText: {
    color: '#fff',
  },
  roomInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  roomInput: {
    flex: 1,
  },
  roomLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  roomTextInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedAmenity: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  amenityText: {
    fontSize: 12,
    color: '#6c757d',
  },
  selectedAmenityText: {
    color: '#fff',
  },
  clearFiltersButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 16,
    color: '#6c757d',
  },
  sortButton: {
    padding: 8,
  },
  sortText: {
    fontSize: 14,
    color: '#007bff',
  },
  propertyList: {
    padding: 20,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  propertyImage: {
    height: 150,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    fontSize: 48,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  propertySpecs: {
    fontSize: 14,
    color: '#6c757d',
  },
  propertyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#6c757d',
  },
  amenitiesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amenityTag: {
    fontSize: 10,
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moreAmenities: {
    fontSize: 10,
    color: '#6c757d',
  },
});