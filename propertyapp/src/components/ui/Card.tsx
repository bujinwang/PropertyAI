import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface CardTitleProps {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

interface CardContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface CardActionsProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardTitle: React.FC<CardTitleProps> = ({
  title,
  subtitle,
  style,
  titleStyle,
  subtitleStyle,
}) => (
  <View style={[styles.cardTitleContainer, style]}>
    <Text style={[styles.cardTitle, titleStyle]}>{title}</Text>
    {subtitle && <Text style={[styles.cardSubtitle, subtitleStyle]}>{subtitle}</Text>}
  </View>
);

const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[styles.cardContent, style]}>{children}</View>
);

const CardActions: React.FC<CardActionsProps> = ({ children, style }) => (
  <View style={[styles.cardActions, style]}>{children}</View>
);

const Card: React.FC<CardProps> & {
  Title: typeof CardTitle;
  Content: typeof CardContent;
  Actions: typeof CardActions;
} = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

Card.Title = CardTitle;
Card.Content = CardContent;
Card.Actions = CardActions;

export { Card };

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  cardTitleContainer: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold as '700',
    color: COLORS.text.primary,
  },
  cardSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    marginTop: SPACING.xs,
  },
  cardContent: {
    marginBottom: SPACING.md,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
}); 