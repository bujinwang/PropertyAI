import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

const MaintenanceScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const submitRequest = async () => {
    try {
      setStatus('Submitting request...');
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });
      const json = await response.json();
      setStatus(`Request submitted: ${JSON.stringify(json)}`);
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error submitting request: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
    }
  };

  return (
    <View>
      <Text>Submit Maintenance Request</Text>
      <TextInput placeholder="Title" onChangeText={setTitle} />
      <TextInput
        placeholder="Description"
        onChangeText={setDescription}
        multiline
      />
      <Button title="Submit Request" onPress={submitRequest} />
      {status && <Text>{status}</Text>}
    </View>
  );
};

export default MaintenanceScreen;
