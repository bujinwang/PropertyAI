import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function PhotoManagementScreen() {
  return (
    <View style={styles.container}>
      <Text>Photo Management Screen</Text>
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
