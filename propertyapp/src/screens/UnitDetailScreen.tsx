import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Button,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { unitService } from '@/services/unitService';
import { listingService } from '@/services/listingService';
import { RootStackParamList } from '@/navigation/types';
import { Unit } from '@/types/unit';
import { Listing } from '@/types/listing';

type UnitDetailScreenRouteProp = RouteProp<RootStackParamList, 'UnitDetail'>;

const UnitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<UnitDetailScreenRouteProp>();
  const { unitId } = route.params;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadUnitDetails();
  }, [unitId]);

  const loadUnitDetails = async () => {
    try {
      setLoading(true);
      const [unitData, listingsData] = await Promise.all([
        unitService.getUnitById(unitId),
        listingService.getUnitListings(unitId),
      ]);
      setUnit(unitData);
      setListings(listingsData);
    } catch (error) {
      console.error('Failed to load unit details:', error);
      Alert.alert('Error', 'Failed to load unit details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUnitDetails();
    setRefreshing(false);
  };

  const handleEditUnit = () => {
    if (unit) {
      navigation.navigate('UnitForm', { unitId, propertyId: unit.propertyId });
    }
  };

  const handleDeleteUnit = async () => {
    try {
      await unitService.deleteUnit(unitId);
      Alert.alert('Success', 'Unit deleted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete unit:', error);
      Alert.alert('Error', 'Failed to delete unit');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleCreateListing = () => {
    if (unit) {
      navigation.navigate('CreateListing', { unitId, propertyId: unit.propertyId });
    }
  };

  const handleListingPress = (listing: Listing) => {
    navigation.navigate('ListingDetail', { listingId: listing.id });
  };

  const renderFeature = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  const renderListing = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.listingItem}
      onPress={() => handleListingPress(item)}
    >
      <View style={styles.listingHeader}>
        <Text style={styles.listingTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, getListingStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.listingPrice}>${item.price}/month</Text>
      {item.description && (
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const getListingStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return styles.activeStatus;
      case 'DRAFT':
        return styles.draftStatus;
      case 'RENTED':
        return styles.rentedStatus;
      default:
        return styles.inactiveStatus;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!unit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unit not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Unit {unit.unitNumber}</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEditUnit} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowDeleteModal(true)} 
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Ionicons name="trash" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.unitHeader}>
            <Text style={styles.unitTitle}>Unit Details</Text>
            <View style={[styles.statusBadge, unit.isAvailable ? styles.available : styles.occupied]}>
              <Text style={styles.statusText}>{unit.isAvailable ? 'Available' : 'Occupied'}</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Floor</Text>
              <Text style={styles.detailValue}>{unit.floorNumber || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{unit.size || 'N/A'} sq ft</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bedrooms</Text>
              <Text style={styles.detailValue}>{unit.bedrooms || 0}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bathrooms</Text>
              <Text style={styles.detailValue}>{unit.bathrooms || 0}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Monthly Rent</Text>
              <Text style={styles.detailValue}>${unit.rent || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Security Deposit</Text>
              <Text style={styles.detailValue}>${unit.deposit || 'N/A'}</Text>
            </View>
          </View>

          {unit.dateAvailable && (
            <View style={styles.availabilitySection}>
              <Text style={styles.sectionTitle}>Available From</Text>
              <Text style={styles.availabilityDate}>{unit.dateAvailable}</Text>
            </View>
          )}

          {unit.features && unit.features.length > 0 && (
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresList}>
                {unit.features.map(renderFeature)}
              </View>
            </View>
          )}
        </View>

        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Listings ({listings.length})</Text>
            <TouchableOpacity style={styles.addListingButton} onPress={handleCreateListing}>
              <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              <Text style={styles.addListingText}>New Listing</Text>
            </TouchableOpacity>
          </View>

          {listings.length > 0 ? (
            <FlatList
              data={listings}
              renderItem={renderListing}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listingsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={48} color={COLORS.text.secondary} />
              <Text style={styles.emptyText}>No listings created for this unit</Text>
              <TouchableOpacity style={styles.createListingButton} onPress={handleCreateListing}>
                <Text style={styles.createListingText}>Create First Listing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Unit</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete Unit {unit.unitNumber}? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowDeleteModal(false)}
                color={COLORS.text.secondary}
              />
              <Button
                title="Delete"
                onPress={handleDeleteUnit}
                color={COLORS.error}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  deleteButton: {
    marginLeft: SPACING.sm,
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
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  unitTitle: {
    fontSize: 20,
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
  occupied: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  detailItem: {
    width: '50%',
    marginBottom: SPACING.md,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  availabilitySection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  availabilityDate: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: SPACING.md,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  listingsSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addListingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
  },
  addListingText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listingsList: {
    gap: SPACING.md,
  },
  listingItem: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  listingDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  activeStatus: {
    backgroundColor: COLORS.success,
  },
  draftStatus: {
    backgroundColor: COLORS.warning,
  },
  rentedStatus: {
    backgroundColor: COLORS.info,
  },
  inactiveStatus: {
    backgroundColor: COLORS.text.secondary,
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
  createListingButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  createListingText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
});

export default UnitDetailScreen;