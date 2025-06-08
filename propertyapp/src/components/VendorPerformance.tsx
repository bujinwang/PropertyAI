import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

interface VendorPerformanceProps {
  vendorId: string;
}

const VendorPerformance: React.FC<VendorPerformanceProps> = ({ vendorId }) => {
  const [score, setScore] = useState(0);
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState('');

  const submitRating = async () => {
    try {
      setStatus('Submitting...');
      const response = await fetch(
        `/api/maintenance/vendors/${vendorId}/ratings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workOrderId: '123', // This is a placeholder
            metricId: '123', // This is a placeholder
            score,
            comments,
            ratedById: '123', // This is a placeholder
          }),
        }
      );
      const json = await response.json();
      setStatus(`Rating submitted: ${JSON.stringify(json)}`);
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error submitting rating: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
    }
  };

  return (
    <View>
      <Text>Vendor Performance</Text>
      <TextInput
        placeholder="Score"
        keyboardType="numeric"
        onChangeText={(text) => setScore(parseInt(text, 10))}
      />
      <TextInput
        placeholder="Comments"
        onChangeText={setComments}
        multiline
      />
      <Button title="Submit Rating" onPress={submitRating} />
      {status && <Text>{status}</Text>}
    </View>
  );
};

export default VendorPerformance;
