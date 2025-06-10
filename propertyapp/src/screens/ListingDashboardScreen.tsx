import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ListingDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Listing Dashboard Screen</Text>
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
