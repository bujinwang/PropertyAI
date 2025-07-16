import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { propertyService } from '@/services/propertyService';
import { unitService } from '@/services/unitService';
import { RootStackParamList } from '@/navigation/types';
import { Property, Unit } from '@/types/property';

type PropertyDetailScreenRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;

const PropertyDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PropertyDetailScreenRouteProp>();
  const { propertyId } = route.params;

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPropertyDetails();
  }, [propertyId]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      const [propertyData, unitsData] = await Promise.all([
        propertyService.getPropertyById(propertyId),
        unitService.getPropertyUnits(propertyId)
      ]);
      setProperty(propertyData);
      setUnits(unitsData);
    } catch (error) {
      console.error('Failed to load property details:', error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPropertyDetails();
    setRefreshing(false);
  };

  const handleAddUnit = () => {
    navigation.navigate('UnitForm', { propertyId });
  };

  const handleViewAllUnits = () => {
    navigation.navigate('UnitList', { 
      propertyId, 
      propertyName: property?.name || 'Property' 
    });
  };

  const handleUnitPress = (unit: Unit) => {
    navigation.navigate('UnitDetail', { unitId: unit.id });
  };

  const handleEditProperty = () => {
    navigation.navigate('PropertyForm', { propertyId });
  };

  const renderUnit = ({ item }: { item: Unit }) => {
    return (
      <TouchableOpacity 
        style={styles.unitItem}
        onPress={() => handleUnitPress(item)}
      >
        <View style={styles.unitHeader}>
          <Text style={styles.unitNumber}>Unit {item.unitNumber}</Text>
          <View style={[styles.statusBadge, item.isAvailable ? styles.available : styles.unavailable]}>
            <Text style={styles.statusText}>{item.isAvailable ? 'Available' : 'Occupied'}</Text>
          </View>
        </View>
        <View style={styles.unitDetails}>
          <Text style={styles.unitSpecs}>{item.bedrooms} bed • {item.bathrooms} bath • {item.size || 0} sq ft</Text>
          {item.rent && <Text style={styles.unitRent}>${item.rent}/month</Text>}
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.text.secondary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>{property.name}</Text>
        
        <TouchableOpacity onPress={handleEditProperty} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <Text style={styles.address}>{property.address}</Text>
          <Text style={styles.location}>{property.city}, {property.state} {property.zipCode}</Text>
          
          <View style={styles.propertyStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statValue}>{property.propertyType}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total Units</Text>
              <Text style={styles.statValue}>{property.totalUnits}</Text>
            </View>
            {property.yearBuilt && (
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Built</Text>
                <Text style={styles.statValue}>{property.yearBuilt}</Text>
              </View>
            )}
          </View>

          {property.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesList}>
                {property.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.unitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Units ({units.length})</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.addButton} onPress={handleAddUnit}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {units.length > 0 ? (
            <View>
              <View style={styles.unitsList}>
                {units.slice(0, 3).map((unit) => renderUnit({ item: unit }))}
              </View>
              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllUnits}>
                <Text style={styles.viewAllText}>
                  View All {units.length} Units
                </Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color={COLORS.text.secondary} />
              <Text style={styles.emptyText}>No units added yet</Text>
              <Button
                title="Add First Unit"
                onPress={handleAddUnit}
                style={styles.emptyButton}
              />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  editButton: {
    padding: SPACING.sm,
  },
  content: {
    padding: SPACING.lg,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  location: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  descriptionSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  amenitiesSection: {
    marginTop: SPACING.md,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  unitsSection: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: SPACING.sm,
  },
  unitsList: {
    gap: SPACING.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  viewAllText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  unitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 12,
  },
  available: {
    backgroundColor: COLORS.success,
  },
  unavailable: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  unitDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  unitSpecs: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  unitRent: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptyButton: {
    marginTop: SPACING.md,
  },
});

export default PropertyDetailScreen;