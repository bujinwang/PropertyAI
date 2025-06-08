import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const aiSuggestions = [
  { id: '1', text: 'Have you tried turning it off and on again?' },
  { id: '2', text: 'I can schedule a technician to come out tomorrow.' },
  { id: '3', text: 'Please provide a photo of the issue.' },
];

const MaintenanceRequestDetailsScreen = ({ route }: { route: any }) => {
  const { requestId } = route.params;

  const renderSuggestion = ({ item }: { item: { id: string; text: string } }) => (
    <View style={styles.suggestionItem}>
      <Text>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maintenance Request Details</Text>
      <Text>Request ID: {requestId}</Text>
      <FlatList
        data={aiSuggestions}
        renderItem={renderSuggestion}
        keyExtractor={item => item.id}
        ListHeaderComponent={<Text style={styles.suggestionsTitle}>AI Suggestions</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  suggestionItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 5,
  },
});

export default MaintenanceRequestDetailsScreen;