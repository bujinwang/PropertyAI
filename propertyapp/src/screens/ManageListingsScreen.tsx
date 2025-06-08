import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ManageListingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Listings</Text>
      <Text>This screen will allow property managers to add, edit, and view their listings.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default ManageListingsScreen;