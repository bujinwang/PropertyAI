import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface CheckboxOption {
  label: string;
  value: string;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  error?: string;
  horizontal?: boolean;
  disabled?: boolean;
}

export function CheckboxGroup({
  label,
  options,
  selectedValues,
  onChange,
  error,
  horizontal = false,
  disabled = false,
}: CheckboxGroupProps) {
  const toggleOption = (value: string) => {
    if (disabled) return;
    
    if (selectedValues.includes(value)) {
      // Remove value if already selected
      onChange(selectedValues.filter((item) => item !== value));
    } else {
      // Add value if not selected
      onChange([...selectedValues, value]);
    }
  };

  const renderOption = (option: CheckboxOption) => {
    const isSelected = selectedValues.includes(option.value);
    
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.optionContainer,
          horizontal ? styles.horizontalOption : null,
          disabled && styles.disabledOption,
        ]}
        onPress={() => toggleOption(option.value)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
            disabled && styles.checkboxDisabled,
          ]}
        >
          {isSelected && (
            <Ionicons
              name="checkmark"
              size={14}
              color={disabled ? COLORS.text.muted : COLORS.background}
            />
          )}
        </View>
        <Text
          style={[
            styles.optionLabel,
            disabled && styles.disabledText,
          ]}
          numberOfLines={2}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {options.map(renderOption)}
        </ScrollView>
      ) : (
        <View style={styles.optionsContainer}>
          {options.map(renderOption)}
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    fontWeight: FONTS.weights.medium as '500',
  },
  scrollContainer: {
    paddingBottom: SPACING.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginBottom: SPACING.sm,
    width: '45%',
  },
  horizontalOption: {
    width: undefined,
    marginRight: SPACING.md,
  },
  disabledOption: {
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxDisabled: {
    borderColor: COLORS.text.muted,
    backgroundColor: COLORS.card,
  },
  optionLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    flex: 1,
  },
  disabledText: {
    color: COLORS.text.muted,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
}); 