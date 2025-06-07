import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useAuth } from '@/contexts';
import { validateEmail } from '@/utils/validation';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { forgotPassword, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  
  // Form validation state
  const [touched, setTouched] = useState({
    email: false,
  });
  
  // Error messages
  const emailError = validateEmail(email);
  
  // Set field as touched when user interacts with it
  const handleBlur = () => {
    setTouched({ email: true });
  };
  
  // Handle forgot password submission
  const handleSubmit = async () => {
    // Mark field as touched to show validation errors
    setTouched({ email: true });
    
    // Return if there are validation errors
    if (emailError) {
      return;
    }
    
    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch (error) {
      Alert.alert(
        'Request Failed',
        'Unable to process your request. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };
  
  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.title}>Email Sent</Text>
          <Text style={styles.message}>
            We have sent password reset instructions to {email}. Please check your inbox.
          </Text>
          <Text style={styles.noteMessage}>
            Note: For this demo app, click the button below to simulate clicking the reset link from your email.
          </Text>
          <Button 
            title="Simulate Reset Link" 
            onPress={() => navigation.navigate('ResetPassword', { token: 'demo-token-123' })} 
            style={styles.simulateButton}
          />
          <Button 
            title="Back to Login" 
            onPress={() => navigation.navigate('Login')} 
            style={styles.button}
          />
        </View>
      </View>
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we will send you instructions to reset your password.
          </Text>
        </View>
        
        <View style={styles.form}>
          <FormInput
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onBlur={handleBlur}
            error={emailError}
            touched={touched.email}
          />
          
          <Button
            title="Reset Password"
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.button}
          />
          
          {isLoading && <LoadingIndicator size="small" style={styles.loader} />}
        </View>
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
  backButton: {
    marginBottom: SPACING.lg,
  },
  backButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold as '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  button: {
    marginTop: SPACING.lg,
  },
  simulateButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.secondary,
  },
  loader: {
    marginTop: SPACING.md,
  },
  successContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  noteMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
}); 