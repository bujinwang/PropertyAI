import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useAuth } from '@/contexts';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setupMFA, enableMFA } from '@/services/authService';
import * as Clipboard from 'expo-clipboard';

type MFASetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MFASetup'>;

export const MFASetupScreen: React.FC = () => {
  const navigation = useNavigation<MFASetupScreenNavigationProp>();
  const { token, user } = useAuth();
  
  // Setup state
  const [isLoading, setIsLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  
  // MFA data
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Fetch MFA setup data on component mount
  useEffect(() => {
    const fetchMFASetupData = async () => {
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      
      try {
        setSetupLoading(true);
        const data = await setupMFA(token);
        
        // QR code URL from backend (Base64 or URL)
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PropertyAI:${data.email}?secret=${data.secret}&issuer=PropertyAI`);
        setSecret(data.secret);
        
        // Generate some backup codes (these would normally come from the backend)
        // In a real app, you'd receive these from the API
        setBackupCodes([
          'ABCD-EFGH-IJKL',
          'MNOP-QRST-UVWX',
          'YZAB-CDEF-GHIJ',
          'KLMN-OPQR-STUV',
          'WXYZ-1234-5678',
          '9ABC-DEFG-HIJK',
        ]);
      } catch (err: any) {
        setError(err.message || 'Failed to set up MFA. Please try again.');
        Alert.alert('Error', err.message || 'Failed to set up MFA. Please try again.');
      } finally {
        setSetupLoading(false);
      }
    };
    
    fetchMFASetupData();
  }, [token, navigation]);
  
  // Copy secret to clipboard
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(secret);
    Alert.alert('Copied', 'Secret key copied to clipboard');
  };
  
  // Handle verification code submission
  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await enableMFA(token!, verificationCode);
      setSetupComplete(true);
      Alert.alert(
        'MFA Enabled',
        'Two-factor authentication has been successfully enabled for your account.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving backup codes (in real app, user might download or print them)
  const handleSaveBackupCodes = async () => {
    await Clipboard.setStringAsync(backupCodes.join('\n'));
    Alert.alert(
      'Backup Codes Copied',
      'Backup codes have been copied to your clipboard. Please save these in a secure location.'
    );
    
    navigation.navigate('Home');
  };
  
  // Cancel setup
  const handleCancel = () => {
    Alert.alert(
      'Cancel Setup',
      'Are you sure you want to cancel MFA setup? Your account will not be protected by two-factor authentication.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        { text: 'Cancel Setup', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };
  
  // If setup is complete, show backup codes
  if (setupComplete) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Setup Complete</Text>
            <Text style={styles.subtitle}>Save your backup codes</Text>
          </View>
          
          <View style={styles.backupCodesContainer}>
            <Text style={styles.instructionsText}>
              These backup codes can be used to access your account if you lose your phone or cannot
              access your authenticator app. Each code can only be used once.
            </Text>
            
            <View style={styles.codesList}>
              {backupCodes.map((code, index) => (
                <Text key={index} style={styles.backupCode}>{code}</Text>
              ))}
            </View>
            
            <Text style={styles.warningText}>
              Keep these codes in a safe place. They won't be shown again!
            </Text>
          </View>
          
          <Button
            title="Copy Codes & Finish"
            onPress={handleSaveBackupCodes}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Enable Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>Enhance your account security</Text>
        </View>
        
        {setupLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Setting up MFA...</Text>
          </View>
        ) : (
          <>
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>1. Scan the QR code</Text>
              <Text style={styles.instructionsText}>
                Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                to scan this QR code.
              </Text>
              
              <View style={styles.qrCodeContainer}>
                {qrCodeUrl ? (
                  <Image 
                    source={{ uri: qrCodeUrl }} 
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrCodePlaceholder} />
                )}
              </View>
              
              <Text style={styles.instructionsTitle}>Or enter this setup key manually:</Text>
              <View style={styles.secretContainer}>
                <Text style={styles.secretText}>{secret}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.verificationContainer}>
              <Text style={styles.instructionsTitle}>2. Enter verification code</Text>
              <Text style={styles.instructionsText}>
                Enter the 6-digit code from your authenticator app to verify setup
              </Text>
              
              <FormInput
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
                error={error}
                touched={!!verificationCode}
              />
              
              <Button
                title={isLoading ? 'Verifying...' : 'Verify & Enable'}
                onPress={handleVerify}
                disabled={isLoading || !verificationCode || verificationCode.length !== 6}
                style={styles.button}
              />
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel Setup</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold as '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
  },
  instructionsContainer: {
    marginBottom: SPACING.xl,
  },
  instructionsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold as '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  instructionsText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  qrCode: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.gray[200],
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
    padding: SPACING.md,
    borderRadius: 8,
    marginVertical: SPACING.md,
  },
  secretText: {
    fontSize: FONTS.sizes.md,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    color: COLORS.text.primary,
  },
  copyButton: {
    marginLeft: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  copyButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium as '500',
  },
  verificationContainer: {
    marginBottom: SPACING.xl,
  },
  button: {
    marginTop: SPACING.md,
  },
  cancelButton: {
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
  },
  backupCodesContainer: {
    marginBottom: SPACING.xl,
  },
  codesList: {
    backgroundColor: COLORS.gray[100],
    padding: SPACING.md,
    borderRadius: 8,
    marginVertical: SPACING.md,
  },
  backupCode: {
    fontSize: FONTS.sizes.md,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.text.primary,
    padding: SPACING.xs,
    letterSpacing: 1,
    textAlign: 'center',
  },
  warningText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    fontWeight: FONTS.weights.medium as '500',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});

export default MFASetupScreen; 