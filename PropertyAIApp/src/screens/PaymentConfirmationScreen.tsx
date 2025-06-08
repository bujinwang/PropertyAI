import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const PaymentConfirmationScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const { transactionId, amount } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment Successful!</Text>
      <Text style={styles.details}>Transaction ID: {transactionId}</Text>
      <Text style={styles.details}>Amount: ${amount.toFixed(2)}</Text>
      <Button title="Done" onPress={() => navigation.navigate('Dashboard')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  details: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default PaymentConfirmationScreen;
