import React, { useState } from 'react';
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
  Modal,
  Image,
} from 'react-native';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useAuth } from '@/contexts';
import { validateEmail, validatePassword } from '@/utils/validation';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MFAVerification from '@/components/auth/MFAVerification';
import { login, loginWithOAuth, OAuthProvider } from '@/services/authService';
import { User } from '@/types/user';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login: authLogin, isLoading: isAuthLoading, setUser, setToken } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // MFA state
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [mfaEmail, setMfaEmail] = useState('');
  
  // Form validation state
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  
  // Error messages
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  
  // Set field as touched when user interacts with it
  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  // Handle login submission
  const handleLogin = async () => {
    // Mark all fields as touched to show validation errors
    setTouched({ email: true, password: true });
    
    // Return if there are validation errors
    if (emailError || passwordError) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await login(email, password);
      
      if (response.requireMFA && response.email) {
        // Show MFA verification modal
        setMfaEmail(response.email);
        setShowMFAModal(true);
      } else if (response.token && response.user) {
        // Standard login successful
        setUser(response.user);
        setToken(response.token);
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your email and password and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle MFA verification success
  const handleMFASuccess = (token: string, user: User) => {
    setShowMFAModal(false);
    setUser(user);
    setToken(token);
  };
  
  // Handle MFA verification cancel
  const handleMFACancel = () => {
    setShowMFAModal(false);
    setMfaEmail('');
  };
  
  // Handle OAuth login
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      setIsLoading(true);
      const response = await loginWithOAuth(provider);
      
      // If we have a URL, we need to open it for the OAuth flow
      if (response.url) {
        // In a real app, you would use Linking.openURL or WebBrowser.openAuthSessionAsync
        // to open the OAuth URL and handle the redirect
        Alert.alert(
          'OAuth Login',
          `In a real app, this would open ${response.url} in a browser or WebView for authentication.`
        );
      } else if (response.requireMFA && response.email) {
        // Show MFA verification modal if MFA is required
        setMfaEmail(response.email);
        setShowMFAModal(true);
      } else if (response.token && response.user) {
        // Standard OAuth login successful
        setUser(response.user);
        setToken(response.token);
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || `Failed to login with ${provider}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
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
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your PropertyAI account</Text>
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
            onBlur={() => handleBlur('email')}
            error={emailError}
            touched={touched.email}
          />
          
          <FormInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onBlur={() => handleBlur('password')}
            error={passwordError}
            touched={touched.password}
          />
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <Button
            title={isLoading ? 'Signing In...' : 'Sign In'}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
          />
          
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.loader}
            />
          )}
          
          <View style={styles.orContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.oauthButtonsContainer}>
            <TouchableOpacity
              style={[styles.oauthButton, styles.googleButton]}
              onPress={() => handleOAuthLogin('google')}
              disabled={isLoading}
            >
              <View style={styles.oauthButtonContent}>
                <Image
                  source={require('@/assets/images/google-logo.png')}
                  style={styles.oauthIcon}
                  resizeMode="contain"
                />
                <Text style={styles.oauthButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.oauthButton, styles.facebookButton]}
              onPress={() => handleOAuthLogin('facebook')}
              disabled={isLoading}
            >
              <View style={styles.oauthButtonContent}>
                <Image
                  source={require('@/assets/images/facebook-logo.png')}
                  style={styles.oauthIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.oauthButtonText, styles.facebookButtonText]}>
                  Continue with Facebook
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
        
        {/* MFA Verification Modal */}
        <Modal
          visible={showMFAModal}
          transparent
          animationType="fade"
          onRequestClose={handleMFACancel}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <MFAVerification
                email={mfaEmail}
                onSuccess={handleMFASuccess}
                onCancel={handleMFACancel}
              />
            </View>
          </View>
        </Modal>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold as '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
  },
  loginButton: {
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
  registerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold as '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // OAuth related styles
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    marginHorizontal: SPACING.md,
  },
  oauthButtonsContainer: {
    marginTop: SPACING.md,
  },
  oauthButton: {
    height: 50,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oauthButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthIcon: {
    width: 24,
    height: 24,
    marginRight: SPACING.md,
  },
  oauthButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.medium as '500',
  },
  googleButton: {
    backgroundColor: '#ffffff',
  },
  facebookButton: {
    backgroundColor: '#3b5998',
  },
  facebookButtonText: {
    color: '#ffffff',
  },
}); 