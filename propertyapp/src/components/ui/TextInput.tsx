import React from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TextInputProps as RNTextInputProps } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({ label, error, touched, ...props }) => {
  const showError = touched && !!error;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        style={[styles.input, showError && styles.inputError]}
        placeholderTextColor={COLORS.text.muted}
        {...props}
      />
      {showError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
});
