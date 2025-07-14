import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const maintenanceRequests = [
  { id: '1', title: 'Leaky Faucet', status: 'Open' },
  { id: '2', title: 'Broken Window', status: 'In Progress' },
  { id: '3', title: 'Heater Not Working', status: 'Closed' },
];

const MaintenanceRequestsScreen = ({ navigation }: { navigation: any }) => {
  const renderItem = ({ item }: { item: { id: string; title: string; status: string } }) => (
    <TouchableOpacity onPress={() => navigation.navigate('MaintenanceRequestDetails', { requestId: item.id })}>
      <View style={styles.item}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={maintenanceRequests}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  item: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
});

export default MaintenanceRequestsScreen;