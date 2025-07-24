import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type PropertyDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Property {
  id: string;
  name: string;
  address: string;
  image: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  description: string;
  amenities: string[];
  type: 'apartment' | 'house' | 'condo';
  yearBuilt: number;
  parking: boolean;
  petsAllowed: boolean;
}

const mockProperty: Property = {
  id: '1',
  name: 'Modern Downtown Apartment',
  address: '123 Main Street, Downtown, NY 10001',
  image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  price: 2850,
  bedrooms: 2,
  bathrooms: 2,
  sqft: 950,
  description: 'Beautiful modern apartment in the heart of downtown with stunning city views. Features updated kitchen, hardwood floors, and in-unit laundry.',
  amenities: ['Gym', 'Pool', 'Parking', 'Doorman', 'Rooftop Deck'],
  type: 'apartment',
  yearBuilt: 2018,
  parking: true,
  petsAllowed: true,
};

export const PropertyDetailScreen: React.FC = () => {
  const navigation = useNavigation<PropertyDetailNavigationProp>();
  const route = useRoute();
  const { propertyId } = route.params as { propertyId: string };

  const handleContact = () => {
    // Navigate to contact screen
    navigation.navigate('ChatDetail' as any, { propertyId });
  };

  const handleSchedule = () => {
    // Navigate to scheduling screen
    navigation.navigate('ScheduleTour' as any, { propertyId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: mockProperty.image }} style={styles.propertyImage} />
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
            <Text style={styles.price}>${mockProperty.price}/month</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{mockProperty.type}</Text>
            </View>
          </View>

          <Text style={styles.title}>{mockProperty.name}</Text>
          <Text style={styles.address}>{mockProperty.address}</Text>

          {/* Property Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="bed-outline" size={20} color="#666" />
              <Text style={styles.statText}>{mockProperty.bedrooms} beds</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="water-outline" size={20} color="#666" />
              <Text style={styles.statText}>{mockProperty.bathrooms} baths</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="square-outline" size={20} color="#666" />
              <Text style={styles.statText}>{mockProperty.sqft} sqft</Text>
            </View>
          </View>

          {/* Description */}
          <Card style={styles.section}>
            <Card.Title title="Description" />
            <Card.Content>
              <Text style={styles.description}>{mockProperty.description}</Text>
            </Card.Content>
          </Card>

          {/* Amenities */}
          <Card style={styles.section}>
            <Card.Title title="Amenities" />
            <Card.Content>
              <View style={styles.amenitiesGrid}>
                {mockProperty.amenities.map((amenity) => (
                  <View key={amenity} style={styles.amenity}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Property Details */}
          <Card style={styles.section}>
            <Card.Title title="Property Details" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{mockProperty.type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Year Built:</Text>
                <Text style={styles.detailValue}>{mockProperty.yearBuilt}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Parking:</Text>
                <Text style={styles.detailValue}>{mockProperty.parking ? 'Available' : 'Not available'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pets:</Text>
                <Text style={styles.detailValue}>{mockProperty.petsAllowed ? 'Allowed' : 'Not allowed'}</Text>
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
});

export default PropertyDetailScreen;