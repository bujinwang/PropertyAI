import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { shadows } from '@/utils/shadows';
import { Rental, PropertyType } from '../../types/rental';

interface PropertyCardProps {
  rental: Rental;
  onPress?: (rental: Rental) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ rental, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(rental);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeDisplay = (type: PropertyType) => {
    switch (type) {
      case PropertyType.APARTMENT:
        return 'Apartment';
      case PropertyType.HOUSE:
        return 'House';
      case PropertyType.CONDO:
        return 'Condo';
      case PropertyType.TOWNHOUSE:
        return 'Townhouse';
      case PropertyType.STUDIO:
        return 'Studio';
      default:
        return 'Property';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Property Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: rental.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image'
          }}
          style={styles.image}
          resizeMode="cover"
        />
        {!rental.isAvailable && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Not Available</Text>
          </View>
        )}
      </View>

      {/* Property Details */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {rental.title}
        </Text>
        
        <Text style={styles.address} numberOfLines={1}>
          {rental.address}, {rental.city}, {rental.state}
        </Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.propertyType}>
            {getPropertyTypeDisplay(rental.propertyType)}
          </Text>
          {rental.bedrooms && rental.bathrooms && (
            <Text style={styles.roomInfo}>
              {rental.bedrooms}BR • {rental.bathrooms}BA
            </Text>
          )}
        </View>

        {rental.size && (
          <Text style={styles.size}>
            {rental.size.toLocaleString()} sq ft
          </Text>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(rental.rent)}/month
          </Text>
          {rental.isAvailable && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  unavailableBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unavailableText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    ...FONTS.medium,
  },
  address: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  propertyType: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  roomInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  size: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
    ...FONTS.bold,
  },
  availableBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availableText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PropertyCard;
