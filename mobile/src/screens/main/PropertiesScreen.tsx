import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, Card, useTheme, ActivityIndicator, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Property } from '@/types';
import { propertyService } from '@/services/propertyService';
import { offlineStorageService } from '@/services/offlineStorageService';
import { useNetwork } from '@/contexts/NetworkContext';

export function PropertiesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { isConnected } = useNetwork();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery, selectedStatus, selectedType]);

  const loadProperties = async () => {
    try {
      setLoading(true);

      // Try to load from offline storage first
      const offlineProperties = await offlineStorageService.getProperties();

      if (offlineProperties.length > 0) {
        setProperties(offlineProperties);
      }

      // If online, fetch from API
      if (isConnected) {
        try {
          const response = await propertyService.getProperties();
          const onlineProperties = response.data.data;

          // Save to offline storage
          for (const property of onlineProperties) {
            await offlineStorageService.saveProperty(property);
          }

          setProperties(onlineProperties);
        } catch (error) {
          console.error('Error fetching properties from API:', error);
          // Use offline data if API fails
        }
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(property => property.status === selectedStatus);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(property => property.type === selectedType);
    }

    setFilteredProperties(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const handlePropertyPress = (property: Property) => {
    // TODO: Navigate to property details
    console.log('Property pressed:', property.id);
  };

  const handleAddProperty = () => {
    // TODO: Navigate to add property screen
    console.log('Add property');
  };

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <Card style={styles.propertyCard} onPress={() => handlePropertyPress(item)}>
      <Card.Content>
        <View style={styles.propertyHeader}>
          <Text variant="titleMedium" style={styles.propertyName}>
            {item.name}
          </Text>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.propertyAddress}>
          {item.address}, {item.city}, {item.state} {item.zipCode}
        </Text>

        <View style={styles.propertyStats}>
          <Text variant="bodySmall" style={styles.statText}>
            {item.totalUnits} units • {item.occupiedUnits} occupied
          </Text>
          <Text variant="bodySmall" style={styles.rentText}>
            ${item.monthlyRent.toLocaleString()}/month
          </Text>
        </View>

        <View style={styles.propertyFooter}>
          <Chip mode="flat" style={styles.typeChip}>
            {item.type}
          </Chip>
          <Text variant="bodySmall" style={styles.updatedText}>
            Updated {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return theme.colors.primary;
      case 'inactive':
        return theme.colors.onSurfaceVariant;
      case 'maintenance':
        return theme.colors.error;
      case 'sold':
        return theme.colors.secondary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(properties.map(p => p.status))];
    return ['all', ...statuses];
  };

  const getUniqueTypes = () => {
    const types = [...new Set(properties.map(p => p.type))];
    return ['all', ...types];
  };

  if (loading && properties.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            Loading properties...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Properties
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search properties..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text variant="bodyMedium" style={styles.filterLabel}>Status:</Text>
          <View style={styles.chipContainer}>
            {getUniqueStatuses().map(status => (
              <Chip
                key={status}
                mode={selectedStatus === status ? 'flat' : 'outlined'}
                onPress={() => setSelectedStatus(status)}
                style={styles.filterChip}
              >
                {status === 'all' ? 'All' : status}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text variant="bodyMedium" style={styles.filterLabel}>Type:</Text>
          <View style={styles.chipContainer}>
            {getUniqueTypes().map(type => (
              <Chip
                key={type}
                mode={selectedType === type ? 'flat' : 'outlined'}
                onPress={() => setSelectedType(type)}
                style={styles.filterChip}
              >
                {type === 'all' ? 'All' : type}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredProperties}
        renderItem={renderPropertyItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {searchQuery || selectedStatus !== 'all' || selectedType !== 'all'
                ? 'No properties match your filters'
                : 'No properties found'
              }
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddProperty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    minWidth: 50,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    marginBottom: 12,
    elevation: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyName: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  propertyAddress: {
    marginBottom: 8,
    opacity: 0.8,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statText: {
    opacity: 0.7,
  },
  rentText: {
    fontWeight: 'bold',
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    height: 28,
  },
  updatedText: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});