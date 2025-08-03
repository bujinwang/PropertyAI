import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { rentalService } from '@/services/rentalService';
import { RootStackParamList } from '@/navigation/types';
import { Rental } from '@/types/rental';

interface UnitListScreenRouteProp extends RouteProp<RootStackParamList, 'UnitList'> {}

const UnitListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<UnitListScreenRouteProp>();
  const { propertyId, propertyName } = route.params;

  const [units, setUnits] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUnits();
  }, [propertyId]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      // Get rentals that are units for this property
      const response = await rentalService.getRentals({ 
        type: 'UNIT',
        parentRentalId: propertyId 
      });
      setUnits(response.data);
    } catch (error) {
      console.error('Failed to load units:', error);
      Alert.alert('Error', 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUnits();
    setRefreshing(false);
  };

  const handleUnitPress = (unit: Rental) => {
    navigation.navigate('RentalDetail', { rentalId: unit.id });
  };

  const handleAddUnit = () => {
    navigation.navigate('RentalForm', { 
      type: 'UNIT',
      parentRentalId: propertyId 
    });
  };

  const renderUnit = ({ item }: { item: Rental }) => (
    <TouchableOpacity 
      style={styles.unitItem}
      onPress={() => handleUnitPress(item)}
    >
      {/* Deprecation Notice */}
      <View style={styles.deprecationNotice}>
        <Ionicons name="warning" size={16} color={COLORS.warning} />
        <Text style={styles.deprecationText}>
          This view is deprecated. Use the new Rental management instead.
        </Text>
      </View>

      <View style={styles.unitHeader}>
        <Text style={styles.unitNumber}>
          {item.unitNumber ? `Unit ${item.unitNumber}` : item.title}
        </Text>
        <View style={[styles.statusBadge, item.isAvailable ? styles.available : styles.unavailable]}>
          <Text style={styles.statusText}>{item.isAvailable ? 'Available' : 'Occupied'}</Text>
        </View>
      </View>
      
      <View style={styles.unitDetails}>
        <Text style={styles.unitSpecs}>
          {item.bedrooms || 0} bed • {item.bathrooms || 0} bath • {item.size || 0} sq ft
        </Text>
        {item.rent && (
          <Text style={styles.unitRent}>${item.rent}/month</Text>
        )}
      </View>

      <View style={styles.unitActions}>
        <TouchableOpacity 
          style={styles.listingButton}
          onPress={() => navigation.navigate('RentalForm', { 
            type: 'LISTING',
            parentRentalId: item.id 
          })}
        >
          <Ionicons name="pricetag" size={16} color={COLORS.primary} />
          <Text style={styles.listingButtonText}>Create Listing</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={24} color={COLORS.text.secondary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{propertyName} Units</Text>
        <TouchableOpacity onPress={handleAddUnit} style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={units}
        renderItem={renderUnit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color={COLORS.text.secondary} />
            <Text style={styles.emptyText}>No units found</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddUnit}>
              <Text style={styles.emptyButtonText}>Add First Unit</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  addButton: {
    padding: SPACING.sm,
  },
  deprecationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  deprecationText: {
    fontSize: 12,
    color: COLORS.warning,
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
  },
  unitItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  unitNumber: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: SPACING.sm,
  },
  unitSpecs: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  unitRent: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  unitActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  listingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
  },
  listingButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptyButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UnitListScreen;