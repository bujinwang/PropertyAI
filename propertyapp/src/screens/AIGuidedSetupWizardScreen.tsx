import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, NavigationProps } from '../navigation/types';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '../contexts/AuthContext';

// Components
import ProgressSteps from '../components/setup-wizard/ProgressSteps';
import PortfolioSizeForm from '../components/setup-wizard/PortfolioSizeForm';
import CommunicationPreferences, { CommunicationPreference } from '../components/setup-wizard/CommunicationPreferences';
import RecommendationsScreen from '../components/setup-wizard/RecommendationsScreen';
import RoleSelectorCard from '../components/setup-wizard/RoleSelectorCard';

// Types and services
import { AIRecommendation, PortfolioSize } from '../services/setupWizardService';
import { UserRole } from '../types/user';

type SetupStep = 'welcome' | 'role' | 'portfolio' | 'communication' | 'notifications' | 'features' | 'privacy' | 'summary';

interface SetupWizardState {
  currentStep: SetupStep;
  selectedRole: UserRole;
  portfolioSize: PortfolioSize;
  communicationPreference: CommunicationPreference;
  notificationRecommendations: AIRecommendation[];
  featureRecommendations: AIRecommendation[];
  privacyRecommendations: AIRecommendation[];
}

// Define the user settings interface to match what updateUserSettings expects
interface UserSettings {
  setupCompleted?: boolean;
  communicationPreference?: CommunicationPreference;
  portfolioSize?: PortfolioSize;
  enabledNotifications?: string[];
  enabledFeatures?: string[];
  privacySettings?: string[];
  privacy?: { [key: string]: boolean };
}

const AIGuidedSetupWizardScreen: React.FC<NavigationProps<'AIGuidedSetupWizard'>> = ({ route }) => {
  const { isFirstLogin, role: routeRole, portfolioSize: routePortfolioSize } = route.params || {};
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, updateUserSettings } = useAuth();
  
  // Get user role from context or route params
  const userRole = routeRole || (user?.role as UserRole) || UserRole.TENANT;
  
  // Setup state
  const [state, setState] = useState<SetupWizardState>({
    currentStep: 'welcome',
    selectedRole: userRole,
    portfolioSize: routePortfolioSize || { properties: 0, units: 0 },
    communicationPreference: 'balanced',
    notificationRecommendations: [],
    featureRecommendations: [],
    privacyRecommendations: [],
  });
  
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Define the steps based on user role
  const getSteps = (): { id: SetupStep; label: string }[] => {
    const steps: { id: SetupStep; label: string }[] = [
      { id: 'welcome', label: 'Welcome' },
      { id: 'role', label: 'Role' },
      { id: 'communication', label: 'Communication' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'features', label: 'Features' },
      { id: 'privacy', label: 'Privacy' },
      { id: 'summary', label: 'Summary' },
    ];
    if (state.selectedRole === UserRole.PROPERTY_MANAGER) {
      steps.splice(2, 0, { id: 'portfolio', label: 'Portfolio' });
    }
    return steps;
  };
  
  const steps = getSteps();
  const currentStepIndex = steps.findIndex(step => step.id === state.currentStep);

  // Helper to animate step transitions
  const animateStep = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    });
  };

  // Handle next step navigation
  const handleNext = () => {
    const steps = getSteps();
    const currentIndex = steps.findIndex(step => step.id === state.currentStep);
    if (currentIndex < steps.length - 1) {
      animateStep(() => {
        setState(prev => ({
          ...prev,
          currentStep: steps[currentIndex + 1].id,
        }));
      });
    }
  };

  // Handle previous step navigation
  const handleBack = () => {
    const steps = getSteps();
    const currentIndex = steps.findIndex(step => step.id === state.currentStep);
    if (currentIndex > 0) {
      animateStep(() => {
        setState(prev => ({
          ...prev,
          currentStep: steps[currentIndex - 1].id,
        }));
      });
    } else {
      // First step, confirm exit
      Alert.alert(
        "Exit Setup",
        "Are you sure you want to exit the setup wizard? Your progress will not be saved.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Exit", 
            style: "destructive",
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  // Handle portfolio size update
  const handleUpdatePortfolioSize = (size: PortfolioSize) => {
    setState(prev => ({
      ...prev,
      portfolioSize: size,
    }));
  };

  // Handle communication preference update
  const handleUpdateCommunicationPreference = (preference: CommunicationPreference) => {
    setState(prev => ({
      ...prev,
      communicationPreference: preference,
    }));
  };

  // Handle notification recommendations update
  const handleUpdateNotificationRecommendations = (recommendations: AIRecommendation[]) => {
    setState(prev => ({
      ...prev,
      notificationRecommendations: recommendations,
    }));
  };

  // Handle feature recommendations update
  const handleUpdateFeatureRecommendations = (recommendations: AIRecommendation[]) => {
    setState(prev => ({
      ...prev,
      featureRecommendations: recommendations,
    }));
  };

  // Handle privacy recommendations update
  const handleUpdatePrivacyRecommendations = (recommendations: AIRecommendation[]) => {
    setState(prev => ({
      ...prev,
      privacyRecommendations: recommendations,
    }));
  };

  // Role selection handler with portfolio reset
  const handleRoleSelect = (role: UserRole) => {
    setState((prev) => ({
      ...prev,
      selectedRole: role,
      portfolioSize: role === UserRole.PROPERTY_MANAGER ? prev.portfolioSize : { properties: 0, units: 0 },
    }));
  };

  // Handle wizard completion
  const handleComplete = async () => {
    try {
      // Filter enabled recommendations
      const enabledNotifications = state.notificationRecommendations
        .filter(rec => rec.enabled)
        .map(rec => rec.id);
      
      const enabledFeatures = state.featureRecommendations
        .filter(rec => rec.enabled)
        .map(rec => rec.id);
      
      const enabledPrivacySettings = state.privacyRecommendations
        .filter(rec => rec.enabled)
        .map(rec => rec.id);
      
      // Update user settings in context
      if (user) {
        // Create settings object that matches the expected type
        const settings: UserSettings = {
          privacy: {},
        };
        
        // Add the additional properties
        settings.setupCompleted = true;
        settings.communicationPreference = state.communicationPreference;
        if (state.selectedRole === UserRole.PROPERTY_MANAGER) {
          settings.portfolioSize = state.portfolioSize;
        }
        settings.enabledNotifications = enabledNotifications;
        settings.enabledFeatures = enabledFeatures;
        settings.privacySettings = enabledPrivacySettings;
        
        await updateUserSettings(settings);
      }
      
      // Navigate to home screen - using the appropriate navigation type
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      
      // Show success message
      Alert.alert(
        "Setup Complete",
        "Your personalized AI settings have been applied.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error saving setup settings:', error);
      Alert.alert(
        "Error",
        "Failed to save your settings. Please try again or contact support.",
        [{ text: "OK" }]
      );
    }
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.welcomeTitle}>Welcome to Property AI</Text>
            <Text style={styles.welcomeSubtitle}>
              Let&apos;s set up your personalized AI experience
            </Text>
            <Text style={styles.welcomeDescription}>
              This wizard will help you configure AI-powered features tailored to your needs.
              Our AI will recommend settings based on your role, preferences, and property portfolio.
            </Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>About Your AI Assistant</Text>
              <Text style={styles.infoText}>
                Property AI uses artificial intelligence to help you manage properties more efficiently.
                Your data is secure and you have full control over how AI is used in your experience.
              </Text>
            </View>
          </View>
        );
      
      case 'role':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.welcomeTitle}>What is your role?</Text>
            <Text style={styles.welcomeDescription}>Select your role to personalize your experience.</Text>
            <RoleSelectorCard
              role={UserRole.PROPERTY_MANAGER}
              selected={state.selectedRole === UserRole.PROPERTY_MANAGER}
              onSelect={handleRoleSelect}
              icon={<Text style={{ fontSize: 32 }}>🏢</Text>}
              label="Property Manager"
              description="Manage multiple properties, tenants, and maintenance."
            />
            <RoleSelectorCard
              role={UserRole.TENANT}
              selected={state.selectedRole === UserRole.TENANT}
              onSelect={handleRoleSelect}
              icon={<Text style={{ fontSize: 32 }}>👤</Text>}
              label="Tenant"
              description="View your unit, submit requests, and communicate."
            />
          </View>
        );
      
      case 'portfolio':
        return (
          <View style={styles.stepContent}>
            <PortfolioSizeForm
              initialValue={state.portfolioSize}
              onUpdate={handleUpdatePortfolioSize}
            />
          </View>
        );
      
      case 'communication':
        return (
          <View style={styles.stepContent}>
            <CommunicationPreferences
              initialValue={state.communicationPreference}
              onUpdate={handleUpdateCommunicationPreference}
            />
          </View>
        );
      
      case 'notifications':
        return (
          <View style={styles.stepContent}>
            <RecommendationsScreen
              category="notifications"
              role={state.selectedRole}
              portfolioSize={state.portfolioSize}
              communicationPreference={state.communicationPreference}
              onUpdateRecommendations={handleUpdateNotificationRecommendations}
            />
          </View>
        );
      
      case 'features':
        return (
          <View style={styles.stepContent}>
            <RecommendationsScreen
              category="features"
              role={state.selectedRole}
              portfolioSize={state.portfolioSize}
              communicationPreference={state.communicationPreference}
              onUpdateRecommendations={handleUpdateFeatureRecommendations}
            />
          </View>
        );
      
      case 'privacy':
        return (
          <View style={styles.stepContent}>
            <RecommendationsScreen
              category="privacy"
              role={state.selectedRole}
              onUpdateRecommendations={handleUpdatePrivacyRecommendations}
            />
          </View>
        );
      
      case 'summary':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.summaryTitle}>Setup Summary</Text>
            <Text style={styles.summarySubtitle}>
              Here&apos;s a summary of your personalized AI setup
            </Text>
            
            {state.selectedRole === UserRole.PROPERTY_MANAGER && (
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Portfolio Size</Text>
                <Text style={styles.sectionText}>
                  {state.portfolioSize.properties} properties with {state.portfolioSize.units} units
                </Text>
              </View>
            )}
            
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Communication Style</Text>
              <Text style={styles.sectionText}>
                {state.communicationPreference === 'efficient' ? 'Minimal' : 
                 state.communicationPreference === 'balanced' ? 'Balanced' : 'Comprehensive'}
              </Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Enabled Features</Text>
              <Text style={styles.sectionText}>
                {state.featureRecommendations.filter(r => r.enabled).length} of {state.featureRecommendations.length} recommended features
              </Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Notification Preferences</Text>
              <Text style={styles.sectionText}>
                {state.notificationRecommendations.filter(r => r.enabled).length} of {state.notificationRecommendations.length} notifications enabled
              </Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Privacy Settings</Text>
              <Text style={styles.sectionText}>
                {state.privacyRecommendations.filter(r => r.enabled).length} of {state.privacyRecommendations.length} privacy features enabled
              </Text>
            </View>
            
            <Text style={styles.completionText}>
              Your AI-powered experience is ready! You can always adjust these settings later in your profile.
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Setup Wizard</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <ProgressSteps 
          steps={steps.map(step => step.label)}
          currentStep={currentStepIndex}
        />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>{renderStepContent()}</Animated.View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.backButton, currentStepIndex === 0 && { opacity: 0.5 }]}
          onPress={handleBack}
          disabled={currentStepIndex === 0}
        >
          <Text style={styles.backButtonText}>
            {currentStepIndex === 0 ? 'Exit' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            (state.currentStep === 'role' && !state.selectedRole) && { opacity: 0.5 },
            (state.currentStep === 'summary') && { backgroundColor: '#38a169' },
          ]}
          onPress={currentStepIndex === steps.length - 1 ? handleComplete : handleNext}
          disabled={
            (state.currentStep === 'role' && !state.selectedRole) ||
            (state.currentStep === 'summary' ? false : false)
          }
        >
          <Text style={styles.nextButtonText}>
            {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContent: {
    flex: 1,
    minHeight: 300,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3182ce',
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  // Welcome step styles
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2d3748',
  },
  welcomeSubtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#4a5568',
  },
  welcomeDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    color: '#4a5568',
  },
  infoBox: {
    backgroundColor: '#ebf8ff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2b6cb0',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2c5282',
  },
  // Summary step styles
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2d3748',
  },
  summarySubtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#4a5568',
  },
  summarySection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d3748',
  },
  sectionText: {
    fontSize: 14,
    color: '#4a5568',
  },
  completionText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 24,
    textAlign: 'center',
    color: '#2d3748',
  },
});

export default AIGuidedSetupWizardScreen; 