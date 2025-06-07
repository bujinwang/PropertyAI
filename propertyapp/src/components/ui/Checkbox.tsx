import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  checkboxStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  error,
  containerStyle,
  labelStyle,
  checkboxStyle,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View 
          style={[
            styles.checkbox, 
            checked ? styles.checked : null,
            error ? styles.error : null,
            disabled ? styles.disabled : null,
            checkboxStyle,
          ]}
        >
          {checked && (
            <View style={styles.checkmark}>
              <View style={styles.checkmarkLeft} />
              <View style={styles.checkmarkRight} />
            </View>
          )}
        </View>
        
        {label && (
          <Text 
            style={[
              styles.label, 
              disabled ? styles.disabledText : null,
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  checked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
    borderColor: COLORS.border,
  },
  error: {
    borderColor: COLORS.error,
  },
  checkmark: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  checkmarkLeft: {
    position: 'absolute',
    width: 3,
    height: 6,
    backgroundColor: 'white',
    left: 4,
    top: 8,
    transform: [{ rotate: '45deg' }],
  },
  checkmarkRight: {
    position: 'absolute',
    width: 3,
    height: 10,
    backgroundColor: 'white',
    right: 5,
    top: 4,
    transform: [{ rotate: '135deg' }],
  },
  label: {
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
    marginLeft: 28, // Align with label text
  },
}); 