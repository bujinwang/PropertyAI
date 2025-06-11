import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type CommunicationPreference = 'efficient' | 'balanced' | 'frequent';

interface CommunicationPreferencesProps {
  initialValue?: CommunicationPreference;
  onUpdate: (preference: CommunicationPreference) => void;
}

interface PreferenceOption {
  value: CommunicationPreference;
  title: string;
  description: string;
  icon: string; // In a real app, we would use actual icons
}

const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({
  initialValue = 'balanced',
  onUpdate,
}) => {
  const [selectedPreference, setSelectedPreference] = useState<CommunicationPreference>(initialValue);

  const handleSelectPreference = (preference: CommunicationPreference) => {
    setSelectedPreference(preference);
    onUpdate(preference);
  };

  const options: PreferenceOption[] = [
    {
      value: 'efficient',
      title: 'Minimal',
      description: 'Only critical notifications. AI summarizes communications and highlights important items.',
      icon: '📊',
    },
    {
      value: 'balanced',
      title: 'Balanced',
      description: 'Important updates with moderate frequency. AI helps prioritize without excessive filtering.',
      icon: '⚖️',
    },
    {
      value: 'frequent',
      title: 'Comprehensive',
      description: 'Stay informed with detailed and frequent updates. AI provides additional context and suggestions.',
      icon: '📱',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Communication Preferences</Text>
      <Text style={styles.subtitle}>
        How would you like AI to manage your communications and notifications?
      </Text>

      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.optionCard,
            selectedPreference === option.value && styles.selectedCard,
          ]}
          onPress={() => handleSelectPreference(option.value)}
        >
          <View style={styles.optionHeader}>
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <Text style={styles.optionTitle}>{option.title}</Text>
          </View>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How this affects your experience</Text>
        <Text style={styles.infoText}>
          Your communication preference determines how AI filters, prioritizes, 
          and enriches information throughout the app. You can change this setting 
          anytime in your profile.
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
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#3182ce',
    backgroundColor: '#ebf8ff',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
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

export default CommunicationPreferences; 