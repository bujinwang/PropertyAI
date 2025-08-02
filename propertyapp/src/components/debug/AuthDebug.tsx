import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { clearAuthData } from '@/utils/secureStorage';
import { useAuth } from '@/contexts';

export const AuthDebug: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  const handleClearAuthData = async () => {
    try {
      await clearAuthData();
      Alert.alert('Success', 'Auth data cleared. Please restart the app.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear auth data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Info</Text>
      <Text>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
      <Text>Is Loading: {isLoading ? 'Yes' : 'No'}</Text>
      <Text>User: {user ? user.email : 'None'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleClearAuthData}>
        <Text style={styles.buttonText}>Clear Auth Data</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});