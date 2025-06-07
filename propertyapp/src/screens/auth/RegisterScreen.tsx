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
import { validateEmail, validateName, validatePassword, validatePasswordConfirmation } from '@/utils/validation';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { Checkbox } from '@/components/ui/Checkbox';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
type UserRole = 'admin' | 'propertyManager' | 'tenant';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isLoading } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('propertyManager');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Form validation state
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });
  
  // Error messages
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const confirmPasswordError = validatePasswordConfirmation(password, confirmPassword);
  const termsError = !termsAccepted && touched.terms ? 'You must accept the terms and conditions' : undefined;
  
  // Set field as touched when user interacts with it
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  // Handle registration submission
  const handleRegister = async () => {
    // Mark all fields as touched to show validation errors
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });
    
    // Return if there are validation errors
    if (nameError || emailError || passwordError || confirmPasswordError || !termsAccepted) {
      return;
    }
    
    try {
      await register(name, email, password, role);
      // Navigation is handled by the AuthContext since it will update isAuthenticated
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        'Unable to create your account. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };
  
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started with PropertyAI</Text>
        </View>
        
        <View style={styles.form}>
          <FormInput
            label="Full Name"
            placeholder="Enter your full name"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            onBlur={() => handleBlur('name')}
            error={nameError}
            touched={touched.name}
          />
          
          <FormInput
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onBlur={() => handleBlur('email')}
            error={emailError}
            touched={touched.email}
          />
          
          <FormInput
            label="Password"
            placeholder="Create a password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onBlur={() => handleBlur('password')}
            error={passwordError}
            touched={touched.password}
          />
          
          <FormInput
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={() => handleBlur('confirmPassword')}
            error={confirmPasswordError}
            touched={touched.confirmPassword}
          />
          
          <RoleSelector
            selectedRole={role}
            onRoleChange={setRole}
            style={styles.roleSelector}
            disabled={isLoading}
          />
          
          <Checkbox
            checked={termsAccepted}
            onPress={() => setTermsAccepted(!termsAccepted)}
            label="I agree to the Terms of Service and Privacy Policy"
            error={termsError}
            containerStyle={styles.termsCheckbox}
            disabled={isLoading}
          />
          
          <Button
            title={isLoading ? 'Creating Account...' : 'Create Account'}
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.button}
          />
          
          {isLoading && <LoadingIndicator size="small" style={styles.loader} />}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>
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
  roleSelector: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  termsCheckbox: {
    marginBottom: SPACING.lg,
  },
  button: {
    marginTop: SPACING.md,
  },
  loader: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    marginRight: SPACING.xs,
  },
  loginText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold as '600',
  },
}); 