import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { AIRecommendation } from '../../services/setupWizardService';
import { shadows } from '../../utils/shadows';

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  onToggle: (id: string, enabled: boolean) => void;
  disabled?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onToggle,
  disabled = false,
}) => {
  const { id, title, description, enabled, configurable, priority } = recommendation;

  // Determine the border color based on priority
  const getBorderColor = () => {
    switch (priority) {
      case 'high':
        return '#e63946'; // Red
      case 'medium':
        return '#f9c74f'; // Yellow
      case 'low':
        return '#43aa8b'; // Green
      default:
        return '#90e0ef'; // Blue
    }
  };

  // Get priority label
  const getPriorityLabel = () => {
    switch (priority) {
      case 'high':
        return 'Highly Recommended';
      case 'medium':
        return 'Recommended';
      case 'low':
        return 'Optional';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: getBorderColor() }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {configurable && (
          <Switch
            value={enabled}
            onValueChange={(value) => onToggle(id, value)}
            disabled={disabled}
            trackColor={{ false: '#d3d3d3', true: '#90cdf4' }}
            thumbColor={enabled ? '#3182ce' : '#f4f3f4'}
          />
        )}
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.footer}>
        <Text style={[styles.priorityLabel, { color: getBorderColor() }]}>
          {getPriorityLabel()}
        </Text>
        
        {!configurable && (
          <Text style={styles.requiredLabel}>Required</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    ...shadows.medium,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  requiredLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#718096',
  },
});

export default RecommendationCard; 