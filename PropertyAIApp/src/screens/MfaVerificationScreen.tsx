import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Button,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../services/authService';

const MfaVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerify = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await AuthService.verifyMfaLogin(mfaCode);
      if (data.success) {
        // @ts-ignore
        navigation.navigate('Dashboard');
      } else {
        setErrorMessage(data.message || 'Verification failed.');
      }
    } catch (error) {
      setErrorMessage('An error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await AuthService.resendMfaCode();
      if (data.success) {
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMessage(data.message || 'Failed to resend code.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while resending the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const isVerifyDisabled = mfaCode.length !== 6 || isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Enter Verification Code</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.instructions}>
          Enter the 6-digit code from your authenticator app.
        </Text>
        <TextInput
          style={styles.verificationInput}
          keyboardType="numeric"
          maxLength={6}
          value={mfaCode}
          onChangeText={setMfaCode}
          placeholder="123456"
        />
        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <Button title="Verify" onPress={handleVerify} disabled={isVerifyDisabled} />
        )}
        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        <TouchableOpacity
          onPress={handleResend}
          style={styles.resendContainer}
          disabled={resendCooldown > 0}
        >
          <Text style={styles.resendText}>
            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  verificationInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    width: '80%',
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#007bff',
    fontSize: 16,
  },
});

export default MfaVerificationScreen;
