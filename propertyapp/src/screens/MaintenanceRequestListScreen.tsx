import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function MaintenanceRequestListScreen() {
  return (
    <View style={styles.container}>
      <Text>Maintenance Request List Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
