import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

type Role = 'admin' | 'propertyManager' | 'tenant';

interface RoleSelectorProps {
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

interface RoleOption {
  value: Role;
  label: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    value: 'propertyManager',
    label: 'Property Manager',
    description: 'Manage properties, units, and tenants',
  },
  {
    value: 'tenant',
    label: 'Tenant',
    description: 'Access your rental information and communicate with managers',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all system features and settings',
  },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
  style,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Select your role</Text>
      
      <View style={styles.optionsContainer}>
        {roleOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              selectedRole === option.value && styles.selectedCard,
              disabled && styles.disabledCard,
            ]}
            onPress={() => !disabled && onRoleChange(option.value)}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <View style={styles.optionHeader}>
              <Text style={[
                styles.optionLabel,
                selectedRole === option.value && styles.selectedLabel,
                disabled && styles.disabledText,
              ]}>
                {option.label}
              </Text>
              
              <View style={[
                styles.radioButton,
                selectedRole === option.value && styles.radioButtonSelected,
                disabled && styles.radioButtonDisabled,
              ]}>
                {selectedRole === option.value && <View style={styles.radioButtonInner} />}
              </View>
            </View>
            
            <Text style={[
              styles.optionDescription,
              selectedRole === option.value && styles.selectedDescription,
              disabled && styles.disabledText,
            ]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium as '500',
    marginBottom: SPACING.sm,
    color: COLORS.text.primary,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`, // 10% opacity primary color
  },
  disabledCard: {
    opacity: 0.6,
    borderColor: COLORS.border,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  optionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold as '600',
    color: COLORS.text.primary,
  },
  selectedLabel: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  selectedDescription: {
    color: COLORS.text.primary,
  },
  disabledText: {
    color: COLORS.text.muted,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
  },
  radioButtonDisabled: {
    borderColor: COLORS.border,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
}); 