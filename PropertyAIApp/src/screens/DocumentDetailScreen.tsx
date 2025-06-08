import React from 'react';
import { View, Text, StyleSheet, Button, Linking, Alert } from 'react-native';

const DocumentDetailScreen: React.FC<{ route: any }> = ({ route }) => {
  const { document } = route.params;

  const handleViewDocument = async () => {
    const url = document.url; // Assuming the document object has a URL property
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{document.name}</Text>
      <Text style={styles.details}>Type: {document.type}</Text>
      <Text style={styles.details}>Date: {document.date}</Text>
      <Button title="View Document" onPress={handleViewDocument} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
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

export default DocumentDetailScreen;
