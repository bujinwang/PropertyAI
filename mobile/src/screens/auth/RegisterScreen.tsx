import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList } from '@/types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const theme = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Create Account
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onBackground }]}>
          Join PropertyAI to manage your properties
        </Text>

        <View style={styles.row}>
          <TextInput
            label="First Name"
            value={formData.firstName}
            onChangeText={(value) => setFormData({ ...formData, firstName: value })}
            mode="outlined"
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            label="Last Name"
            value={formData.lastName}
            onChangeText={(value) => setFormData({ ...formData, lastName: value })}
            mode="outlined"
            style={[styles.input, styles.halfInput]}
          />
        </View>

        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(value) => setFormData({ ...formData, email: value })}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={formData.password}
          onChangeText={(value) => setFormData({ ...formData, password: value })}
          mode="outlined"
          secureTextEntry
          autoComplete="password-new"
          style={styles.input}
        />

        <TextInput
          label="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
          mode="outlined"
          secureTextEntry
          autoComplete="password-new"
          style={styles.input}
        />

        {error && (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="white" size="small" /> : 'Create Account'}
        </Button>

        <Button
          mode="text"
          onPress={handleLogin}
          style={styles.linkButton}
        >
          Already have an account? Sign In
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 0.48,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
  },
  linkButton: {
    marginTop: 8,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
});