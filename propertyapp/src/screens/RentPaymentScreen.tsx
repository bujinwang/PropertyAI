import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function RentPaymentScreen() {
  return (
    <View style={styles.container}>
      <Text>Rent Payment Screen</Text>
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
