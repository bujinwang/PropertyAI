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

type UnitDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Unit {
  id: string;
  unitNumber: string;
  propertyName: string;
  image: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  description: string;
  availability: 'available' | 'occupied' | 'maintenance';
  leaseTerms: string[];
  features: string[];
  floor: number;
  view: string;
}

const mockUnit: Unit = {
  id: '1',
  unitNumber: '2B',
  propertyName: 'Sunset Apartments',
  image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  price: 2200,
  bedrooms: 1,
  bathrooms: 1,
  sqft: 650,
  description: 'Beautiful 1-bedroom unit with modern finishes and great natural light. Features updated kitchen, hardwood floors, and in-unit laundry.',
  availability: 'available',
  leaseTerms: ['12 months', '24 months', 'Month-to-month'],
  features: ['In-unit laundry', 'Dishwasher', 'Central air', 'Balcony', 'Storage'],
  floor: 2,
  view: 'City skyline',
};

export const UnitDetailScreen: React.FC = () => {
  const navigation = useNavigation<UnitDetailNavigationProp>();
  const route = useRoute();
  const { unitId } = route.params as { unitId: string };

  const handleApply = () => {
    navigation.navigate('Application' as any, { unitId });
  };

  const handleContact = () => {
    navigation.navigate('ChatDetail' as any, { unitId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: mockUnit.image }} style={styles.unitImage} />
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Unit Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.unitNumber}>{mockUnit.unitNumber}</Text>
            <View style={[styles.availabilityBadge, { 
              backgroundColor: mockUnit.availability === 'available' ? '#34C759' : 
                             mockUnit.availability === 'occupied' ? '#FF3B30' : '#FF9500'
            }]}>
              <Text style={styles.availabilityText}>
                {mockUnit.availability.charAt(0).toUpperCase() + mockUnit.availability.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.propertyName}>{mockUnit.propertyName}</Text>
          <Text style={styles.price}>${mockUnit.price}/month</Text>

          {/* Unit Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="bed-outline" size={20} color="#666" />
              <Text style={styles.statText}>{mockUnit.bedrooms} bed</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="water-outline" size={20} color="#666" />
              <Text style={styles.statText}>{mockUnit.bathrooms} bath</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="square-outline" size={20} color="#666" />
              <Text style={styles.statText}>{mockUnit.sqft} sqft</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="layers-outline" size={20} color="#666" />
              <Text style={styles.statText}>Floor {mockUnit.floor}</Text>
            </View>
          </View>

          {/* Description */}
          <Card style={styles.section}>
            <Card.Title title="Description" />
            <Card.Content>
              <Text style={styles.description}>{mockUnit.description}</Text>
            </Card.Content>
          </Card>

          {/* Features */}
          <Card style={styles.section}>
            <Card.Title title="Unit Features" />
            <Card.Content>
              <View style={styles.featuresGrid}>
                {mockUnit.features.map((feature) => (
                  <View key={feature} style={styles.feature}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Lease Terms */}
          <Card style={styles.section}>
            <Card.Title title="Available Lease Terms" />
            <Card.Content>
              {mockUnit.leaseTerms.map((term) => (
                <View key={term} style={styles.leaseTerm}>
                  <Ionicons name="calendar-outline" size={16} color="#007AFF" />
                  <Text style={styles.leaseTermText}>{term}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Unit Details */}
          <Card style={styles.section}>
            <Card.Title title="Unit Details" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Floor:</Text>
                <Text style={styles.detailValue}>{mockUnit.floor}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>View:</Text>
                <Text style={styles.detailValue}>{mockUnit.view}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Square Footage:</Text>
                <Text style={styles.detailValue}>{mockUnit.sqft} sqft</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          {mockUnit.availability === 'available' && (
            <View style={styles.actionButtons}>
              <Button
                title="Apply Now"
                variant="primary"
                onPress={handleApply}
                style={styles.button}
              />
              <Button
                title="Contact Manager"
                variant="outline"
                onPress={handleContact}
                style={styles.button}
              />
            </View>
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
  imageContainer: {
    position: 'relative',
  },
  unitImage: {
    width: '100%',
    height: 250,
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
  unitNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  propertyName: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  leaseTerm: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaseTermText: {
    fontSize: 16,
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

export default UnitDetailScreen;