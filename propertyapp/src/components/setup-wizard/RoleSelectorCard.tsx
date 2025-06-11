import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserRole } from '../../types/user';

interface RoleSelectorCardProps {
  role: UserRole;
  selected: boolean;
  onSelect: (role: UserRole) => void;
  icon?: React.ReactNode;
  label: string;
  description?: string;
}

const RoleSelectorCard: React.FC<RoleSelectorCardProps> = ({
  role,
  selected,
  onSelect,
  icon,
  label,
  description,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard]}
      onPress={() => onSelect(role)}
      activeOpacity={0.85}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#3182ce',
    backgroundColor: '#ebf8ff',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#4a5568',
  },
});

export default RoleSelectorCard; 