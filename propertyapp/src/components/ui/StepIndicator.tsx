import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepPress?: (step: number) => void;
  allowStepSkip?: boolean;
}

export function StepIndicator({
  steps,
  currentStep,
  onStepPress,
  allowStepSkip = false,
}: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = allowStepSkip || isCompleted;
          
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <View 
                  style={[
                    styles.connector, 
                    isCompleted ? styles.connectorCompleted : styles.connectorIncomplete
                  ]} 
                />
              )}
              
              <TouchableOpacity
                style={[
                  styles.stepContainer,
                  isClickable && styles.stepClickable,
                ]}
                onPress={() => isClickable && onStepPress && onStepPress(index)}
                disabled={!isClickable}
              >
                <View
                  style={[
                    styles.stepCircle,
                    isActive && styles.stepCircleActive,
                    isCompleted && styles.stepCircleCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      (isActive || isCompleted) && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isCompleted && styles.stepLabelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {step}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  stepContainer: {
    alignItems: 'center',
    width: 80,
  },
  stepClickable: {
    opacity: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepNumber: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semiBold as '600',
    color: COLORS.text.secondary,
  },
  stepNumberActive: {
    color: COLORS.background,
  },
  stepLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium as '500',
  },
  stepLabelCompleted: {
    color: COLORS.success,
  },
  connector: {
    height: 2,
    width: 20,
    marginHorizontal: -5,
  },
  connectorCompleted: {
    backgroundColor: COLORS.success,
  },
  connectorIncomplete: {
    backgroundColor: COLORS.border,
  },
}); 