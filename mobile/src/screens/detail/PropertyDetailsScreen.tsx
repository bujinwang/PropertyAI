import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { propertyService } from '@/services/propertyService';
import { Property } from '@/types';

interface PropertyDetailsScreenProps {
  route: {
    params: {
      propertyId: string;
    };
  };
  navigation: any;
}

export function PropertyDetailsScreen({ route, navigation }: PropertyDetailsScreenProps) {
  const { propertyId } = route.params;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPropertyDetails();
  }, [propertyId]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getPropertyById(propertyId);
      setProperty(response.data);
    } catch (error) {
      console.error('Error loading property details:', error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPropertyDetails();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <Text>Property not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Property Header */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium">{property.name}</Text>
            <Text variant="bodyMedium" style={styles.address}>
              {property.address}
            </Text>
            <View style={styles.chipContainer}>
              <Chip icon="home" style={styles.chip}>
                {property.type}
              </Chip>
              <Chip icon="check-circle" style={styles.chip}>
                {property.status}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Property Details */}
        <Card style={styles.card}>
          <Card.Title title="Property Information" />
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Units:
              </Text>
              <Text variant="bodyMedium">{property.unitCount || 'N/A'}</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Year Built:
              </Text>
              <Text variant="bodyMedium">{property.yearBuilt || 'N/A'}</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Square Footage:
              </Text>
              <Text variant="bodyMedium">{property.squareFeet ? `${property.squareFeet} sq ft` : 'N/A'}</Text>
            </View>
            <Divider style={styles.divider} />
            
            {property.description && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Description
                </Text>
                <Text variant="bodyMedium">{property.description}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Amenities" />
            <Card.Content>
              <View style={styles.amenitiesContainer}>
                {property.amenities.map((amenity, index) => (
                  <Chip key={index} style={styles.amenityChip}>
                    {amenity}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              icon="pencil"
              onPress={() => navigation.navigate('EditProperty', { propertyId })}
              style={styles.actionButton}
            >
              Edit Property
            </Button>
            <Button
              mode="outlined"
              icon="image-multiple"
              onPress={() => navigation.navigate('PropertyGallery', { propertyId })}
              style={styles.actionButton}
            >
              View Gallery
            </Button>
            <Button
              mode="outlined"
              icon="home-city"
              onPress={() => navigation.navigate('Units', { propertyId })}
              style={styles.actionButton}
            >
              View Units
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  address: {
    color: '#666',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    marginVertical: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    marginBottom: 8,
  },
  actionButton: {
    marginVertical: 6,
  },
  button: {
    marginTop: 16,
  },
});

export default PropertyDetailsScreen;
