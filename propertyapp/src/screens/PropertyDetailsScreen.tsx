import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { getPropertyDetails } from '../services/api';
import { Property } from '../types/property';

type PropertyDetailsScreenRouteProp = RouteProp<RootStackParamList, 'PropertyDetails'>;
type PropertyDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PropertyDetails'>;

type Props = {
  route: PropertyDetailsScreenRouteProp;
  navigation: PropertyDetailsScreenNavigationProp;
};

const PropertyDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { propertyId } = route.params;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const data = await getPropertyDetails(propertyId);
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <Text>Property not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: property.photos[0] }} style={styles.headerImage} />
      <View style={styles.detailsContainer}>
        <Text style={styles.address}>{property.address}</Text>
        <Text style={styles.rent}>{`$${property.rent} / month`}</Text>
        <Text style={styles.bedsBaths}>{`${property.bedrooms} beds / ${property.bathrooms} baths`}</Text>
        <Text style={styles.description}>{property.description}</Text>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => navigation.navigate('Application', { unitId: property.units[0].id })}
        >
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  detailsContainer: {
    padding: 20,
  },
  address: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 10,
  },
  bedsBaths: {
    fontSize: 16,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  applyButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PropertyDetailsScreen;
