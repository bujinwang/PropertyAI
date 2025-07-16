import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type EditListingScreenRouteProp = RouteProp<RootStackParamList, 'EditListing'>;
type EditListingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditListing'>;

type Props = {
  route: EditListingScreenRouteProp;
  navigation: EditListingScreenNavigationProp;
};

const EditListingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { listingId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const handleSave = async () => {
    try {
      await propertyService.updateListing(listingId, { title, description, price });
      navigation.goBack();
    } catch (error) {
      console.error('Error saving listing:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <Button title="Save" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
});

export default EditListingScreen;
