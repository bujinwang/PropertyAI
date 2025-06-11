import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { PortfolioSize } from '../../services/setupWizardService';

interface PortfolioSizeFormProps {
  initialValue?: PortfolioSize;
  onUpdate: (size: PortfolioSize) => void;
}

const PortfolioSizeForm: React.FC<PortfolioSizeFormProps> = ({ 
  initialValue = { properties: 0, units: 0 },
  onUpdate 
}) => {
  const [properties, setProperties] = useState(initialValue.properties.toString());
  const [units, setUnits] = useState(initialValue.units.toString());

  // Convert input to number and update parent component
  const handlePropertiesChange = (value: string) => {
    setProperties(value);
    const numValue = parseInt(value) || 0;
    onUpdate({ properties: numValue, units: parseInt(units) || 0 });
  };

  // Convert input to number and update parent component
  const handleUnitsChange = (value: string) => {
    setUnits(value);
    const numValue = parseInt(value) || 0;
    onUpdate({ properties: parseInt(properties) || 0, units: numValue });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tell us about your portfolio</Text>
      <Text style={styles.subtitle}>
        This information helps us customize your experience with personalized AI recommendations
      </Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Number of Properties</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={properties}
          onChangeText={handlePropertiesChange}
          placeholder="0"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Total Rental Units</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={units}
          onChangeText={handleUnitsChange}
          placeholder="0"
        />
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Why we ask</Text>
        <Text style={styles.infoText}>
          Your portfolio size helps us tailor notifications, automation features, and AI tools to match your needs.
          Larger portfolios may benefit from different features than smaller ones.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0369a1',
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
});

export default PortfolioSizeForm; 