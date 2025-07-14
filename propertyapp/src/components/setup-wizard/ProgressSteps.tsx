import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step circle */}
            <View 
              style={[
                styles.stepCircle, 
                index < currentStep ? styles.completedStep : 
                index === currentStep ? styles.currentStep : 
                styles.futureStep
              ]}
            >
              <Text 
                style={[
                  styles.stepNumber,
                  (index <= currentStep) ? styles.activeStepNumber : styles.inactiveStepNumber
                ]}
              >
                {index + 1}
              </Text>
            </View>
            
            {/* Connector line (except after the last step) */}
            {index < steps.length - 1 && (
              <View 
                style={[
                  styles.connector, 
                  index < currentStep ? styles.completedConnector : styles.incompleteConnector
                ]} 
              />
            )}
          </React.Fragment>
        ))}
      </View>
      
      {/* Step labels */}
      <View style={styles.labelsContainer}>
        {steps.map((step, index) => (
          <Text 
            key={index} 
            style={[
              styles.stepLabel,
              index === currentStep && styles.currentStepLabel
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStep: {
    backgroundColor: '#3182ce',
  },
  currentStep: {
    backgroundColor: '#90cdf4',
  },
  futureStep: {
    backgroundColor: '#e2e8f0',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStepNumber: {
    color: '#ffffff',
  },
  inactiveStepNumber: {
    color: '#718096',
  },
  connector: {
    height: 3,
    flex: 1,
  },
  completedConnector: {
    backgroundColor: '#3182ce',
  },
  incompleteConnector: {
    backgroundColor: '#e2e8f0',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    width: 80, // Fixed width for each label
  },
  currentStepLabel: {
    color: '#2d3748',
    fontWeight: '600',
  },
});

export default ProgressSteps; 