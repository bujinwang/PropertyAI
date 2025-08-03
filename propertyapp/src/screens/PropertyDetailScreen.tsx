import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { rentalService } from '@/services/rentalService';
import { Rental } from '@/types/rental';

type PropertyDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PropertyDetailScreen: React.FC = () => {
  const navigation = useNavigation<PropertyDetailNavigationProp>();
  const route = useRoute();
  const { propertyId } = route.params as { propertyId: string };

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRental();
  }, [propertyId]);

  const loadRental = async () => {
    try {
      setLoading(true);
      const rentalData = await rentalService.getRentalById(propertyId);
      setRental(rentalData);
    } catch (error) {
      console.error('Failed to load rental:', error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    // Navigate to contact screen
    navigation.navigate('ChatDetail' as any, { rentalId: propertyId });
  };

  const handleSchedule = () => {
    // Navigate to scheduling screen
    navigation.navigate('ScheduleTour' as any, { rentalId: propertyId });
  };

  const handleViewUnits = () => {
    navigation.navigate('UnitList', { 
      propertyId: rental?.id, 
      propertyName: rental?.title 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Property not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const amenitiesList = rental.amenities ? 
    (Array.isArray(rental.amenities) ? rental.amenities : Object.keys(rental.amenities)) : 
    [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Deprecation Notice */}
      <View style={styles.deprecationNotice}>
        <Ionicons name="warning" size={16} color="#FF9500" />
        <Text style={styles.deprecationText}>
          This view is deprecated. Use the new Rental Detail view instead.
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('RentalDetail', { rentalId: rental.id })}
        >
          <Text style={styles.deprecationLink}>Switch to new view</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: rental.images?.[0]?.url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800' 
            }} 
            style={styles.propertyImage} 
          />
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Property Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.price}>${rental.rent}/month</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{rental.propertyType.toLowerCase()}</Text>
            </View>
          </View>

          <Text style={styles.title}>{rental.title}</Text>
          <Text style={styles.address}>
            {rental.address}, {rental.city}, {rental.state} {rental.zipCode}
          </Text>

          {/* Property Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="bed-outline" size={20} color="#666" />
              <Text style={styles.statText}>{rental.bedrooms || 0} beds</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="water-outline" size={20} color="#666" />
              <Text style={styles.statText}>{rental.bathrooms || 0} baths</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="square-outline" size={20} color="#666" />
              <Text style={styles.statText}>{rental.size || 0} sqft</Text>
            </View>
          </View>

          {/* Description */}
          {rental.description && (
            <Card style={styles.section}>
              <Card.Title title="Description" />
              <Card.Content>
                <Text style={styles.description}>{rental.description}</Text>
              </Card.Content>
            </Card>
          )}

          {/* Amenities */}
          {amenitiesList.length > 0 && (
            <Card style={styles.section}>
              <Card.Title title="Amenities" />
              <Card.Content>
                <View style={styles.amenitiesGrid}>
                  {amenitiesList.map((amenity, index) => (
                    <View key={index} style={styles.amenity}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Property Details */}
          <Card style={styles.section}>
            <Card.Title title="Property Details" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{rental.propertyType}</Text>
              </View>
              {rental.yearBuilt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Year Built:</Text>
                  <Text style={styles.detailValue}>{rental.yearBuilt}</Text>
                </View>
              )}
              {rental.totalUnits && rental.totalUnits > 1 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Units:</Text>
                  <Text style={styles.detailValue}>{rental.totalUnits}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>
                  {rental.isAvailable ? 'Available' : 'Not Available'}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Contact Agent"
              variant="primary"
              onPress={handleContact}
              style={styles.button}
            />
            <Button
              title="Schedule Tour"
              variant="outline"
              onPress={handleSchedule}
              style={styles.button}
            />
          </View>

          {/* View Units Button for Properties */}
          {rental.totalUnits && rental.totalUnits > 1 && (
            <Button
              title="View Units"
              variant="outline"
              onPress={handleViewUnits}
              style={styles.unitsButton}
            />
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  deprecationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    gap: 8,
  },
  deprecationText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
  },
  deprecationLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  typeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  stat: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
  },
  unitsButton: {
    marginTop: 12,
  },
});

export default PropertyDetailScreen;