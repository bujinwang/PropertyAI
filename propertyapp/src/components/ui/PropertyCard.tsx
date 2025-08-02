import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { shadows } from '@/utils/shadows';

interface Property {
  id: string;
  title: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  imageUrl: string;
}

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: property.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <Text style={styles.address} numberOfLines={1}>{property.address}</Text>
        <Text style={styles.price}>{property.price}</Text>
        <View style={styles.features}>
          <Text style={styles.featureText}>{property.bedrooms} bed</Text>
          <Text style={styles.featureText}>{property.bathrooms} bath</Text>
          <Text style={styles.featureText}>{property.squareFeet} sqft</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold as '700',
    marginBottom: SPACING.xs,
    color: COLORS.text.primary,
  },
  address: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  price: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  featureText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
});
