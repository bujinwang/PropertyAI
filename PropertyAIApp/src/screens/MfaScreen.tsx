import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Switch,
  Button,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AuthService from '../services/authService';

const MfaScreen: React.FC = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [mfaSetupUri, setMfaSetupUri] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManualSetup, setShowManualSetup] = useState(false);

  const handleToggleMfa = async (value: boolean) => {
    setMfaEnabled(value);
    if (value) {
      setLoading(true);
      setError('');
      try {
        const data = await AuthService.getMfaSetupUri();
        setMfaSetupUri(data.uri);
      } catch (e) {
        setError('Failed to get MFA setup URI.');
      } finally {
        setLoading(false);
      }
    } else {
      setMfaVerified(false);
    }
  };

  const handleManualSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await AuthService.getMfaSecret();
      setMfaSecret(data.secret);
      setShowManualSetup(true);
    } catch (e) {
      setError('Failed to get MFA secret.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await AuthService.verifyMfa(verificationCode);
      if (data.success) {
        setMfaVerified(true);
      } else {
        setError(data.message || 'Invalid verification code.');
      }
    } catch (e) {
      setError('Failed to verify MFA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Set Up Two-Factor Authentication</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.toggleContainer}>
          <Text>Enable Two-Factor Authentication</Text>
          <Switch value={mfaEnabled} onValueChange={handleToggleMfa} />
        </View>

        {mfaEnabled && !mfaVerified && (
          <View>
            <Text style={styles.instructions}>
              Scan this QR code with your authenticator app.
            </Text>
            {loading ? (
              <ActivityIndicator />
            ) : (
              mfaSetupUri ? <QRCode value={mfaSetupUri} /> : <View style={styles.qrCodePlaceholder} />
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.instructions}>
              Or enter this key manually:
            </Text>
            <Button title="Set up manually" onPress={handleManualSetup} />
            {showManualSetup && (
              <View>
                <Text style={styles.manualSetupKey}>{mfaSecret}</Text>
                <Button title="Copy Key" onPress={() => {}} />
              </View>
            )}
            <View style={styles.verificationContainer}>
              <Text>Enter Verification Code</Text>
              <TextInput
                style={styles.verificationInput}
                keyboardType="numeric"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
              <Button title="Verify" onPress={handleVerifyMfa} />
            </View>
          </View>
        )}

        {mfaEnabled && mfaVerified && (
          <View style={styles.backupCodesContainer}>
            <Text style={styles.instructions}>
              MFA is enabled. Save these backup codes in a safe place.
            </Text>
            <View style={styles.backupCodes}>
              <Text>XXXXXXXXXXXXXXXX</Text>
              <Text>XXXXXXXXXXXXXXXX</Text>
              <Text>XXXXXXXXXXXXXXXX</Text>
              <Text>XXXXXXXXXXXXXXXX</Text>
              <Text>XXXXXXXXXXXXXXXX</Text>
            </View>
            <Button title="Copy Codes" onPress={() => {}} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#ccc',
    alignSelf: 'center',
  },
  manualSetupKey: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backupCodesContainer: {
    marginTop: 20,
  },
  backupCodes: {
    marginVertical: 10,
  },
  verificationContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  verificationInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    width: 200,
    textAlign: 'center',
    fontSize: 20,
    marginVertical: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});

export default MfaScreen;
