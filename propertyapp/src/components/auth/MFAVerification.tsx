import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { verifyMFACode } from '../../services/authService';

interface MFAVerificationProps {
  email: string;
  onSuccess: (token: string, user: any) => void;
  onCancel: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ email, onSuccess, onCancel }) => {
  const { colors } = useTheme();
  const { setUser, setToken } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter your verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyMFACode(email, code);
      
      if (response.token && response.user) {
        // Store auth info in context
        setUser(response.user);
        setToken(response.token);
        
        // Call success callback
        onSuccess(response.token, response.user);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify MFA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Two-Factor Authentication
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Please enter the verification code from your authenticator app
      </Text>
      
      <TextInput
        style={[
          styles.input,
          { 
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.inputBackground
          }
        ]}
        placeholder="Enter 6-digit code"
        placeholderTextColor={colors.textSecondary}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        disabled={loading}
      >
        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    marginBottom: 20,
    letterSpacing: 4,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
});

export default MFAVerification; 