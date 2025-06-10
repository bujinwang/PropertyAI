import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

interface StatusBadgeProps {
  status: 'active' | 'pending' | 'rented' | 'inactive';
  text: string;
}

const statusColors = {
  active: {
    background: COLORS.success,
    text: COLORS.card,
  },
  pending: {
    background: COLORS.warning,
    text: COLORS.card,
  },
  rented: {
    background: COLORS.primary,
    text: COLORS.card,
  },
  inactive: {
    background: COLORS.text.muted,
    text: COLORS.card,
  },
};

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const badgeStyle = {
    backgroundColor: statusColors[status].background,
  };

  const textStyle = {
    color: statusColors[status].text,
  };

  return (
    <View style={[styles.container, badgeStyle]}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium as '500',
  },
});
