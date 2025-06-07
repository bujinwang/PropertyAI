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
import { validatePassword, validatePasswordConfirmation } from '@/utils/validation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { resetPassword, isLoading } = useAuth();
  const { token } = route.params;

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Form validation state
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  
  // Error messages
  const passwordError = validatePassword(password);
  const confirmPasswordError = validatePasswordConfirmation(password, confirmPassword);
  
  // Set field as touched when user interacts with it
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  // Handle reset password submission
  const handleResetPassword = async () => {
    // Mark all fields as touched to show validation errors
    setTouched({
      password: true,
      confirmPassword: true,
    });
    
    // Return if there are validation errors
    if (passwordError || confirmPasswordError) {
      return;
    }
    
    try {
      // In a real app, we would pass the token from the URL
      await resetPassword(token, password);
      setResetSuccess(true);
    } catch (error) {
      Alert.alert(
        'Password Reset Failed',
        'Unable to reset your password. The link may have expired or is invalid.',
        [{ text: 'OK' }]
      );
    }
  };
  
  if (resetSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.title}>Password Reset Successful</Text>
          <Text style={styles.message}>
            Your password has been successfully reset. You can now log in with your new password.
          </Text>
          <Button 
            title="Go to Login" 
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Create a new password for your account
          </Text>
        </View>
        
        <View style={styles.form}>
          <FormInput
            label="New Password"
            placeholder="Enter your new password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onBlur={() => handleBlur('password')}
            error={passwordError}
            touched={touched.password}
          />
          
          <FormInput
            label="Confirm Password"
            placeholder="Confirm your new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={() => handleBlur('confirmPassword')}
            error={confirmPasswordError}
            touched={touched.confirmPassword}
          />
          
          <Button
            title={isLoading ? 'Resetting Password...' : 'Reset Password'}
            onPress={handleResetPassword}
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
    marginBottom: SPACING.xl,
  },
}); 