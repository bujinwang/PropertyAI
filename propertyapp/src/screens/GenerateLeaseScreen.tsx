import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { api } from '../services/api';

const GenerateLeaseScreen = () => {
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  const handleGenerateLease = async () => {
    try {
      await api.post('/documents/generate-lease', {
        propertyId,
        unitId,
        tenantId,
        startDate,
        endDate,
        rentAmount: parseFloat(rentAmount),
        securityDeposit: parseFloat(securityDeposit),
      });
      alert('Lease generated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to generate lease.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Lease Agreement</Text>
      <TextInput
        style={styles.input}
        placeholder="Property ID"
        value={propertyId}
        onChangeText={setPropertyId}
      />
      <TextInput
        style={styles.input}
        placeholder="Unit ID"
        value={unitId}
        onChangeText={setUnitId}
      />
      <TextInput
        style={styles.input}
        placeholder="Tenant ID"
        value={tenantId}
        onChangeText={setTenantId}
      />
      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Rent Amount"
        value={rentAmount}
        onChangeText={setRentAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Security Deposit"
        value={securityDeposit}
        onChangeText={setSecurityDeposit}
        keyboardType="numeric"
      />
      <Button title="Generate Lease" onPress={handleGenerateLease} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default GenerateLeaseScreen;
