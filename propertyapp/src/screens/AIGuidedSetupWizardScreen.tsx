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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/contexts';

type AIGuidedSetupWizardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AIGuidedSetupWizard'
>;

type UserRole = 'admin' | 'propertyManager' | 'tenant';

// AI suggestions types
interface NotificationSuggestion {
  id: string;
  type: string;
  channel: 'email' | 'push' | 'sms';
  frequency: 'immediate' | 'daily' | 'weekly';
  enabled: boolean;
}

interface FeatureSuggestion {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const AIGuidedSetupWizardScreen: React.FC = () => {
  const navigation = useNavigation<AIGuidedSetupWizardScreenNavigationProp>();
  const { user, updateUserSettings } = useAuth();
  
  // Step control
  const steps = [
    'Role Selection',
    'Profile Setup',
    'Notifications',
    'AI Personalization',
    'Summary'
  ];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState(false);
  
  // Form state
  const [role, setRole] = useState<UserRole>(user?.role || 'propertyManager');
  const [portfolioSize, setPortfolioSize] = useState<string>(user?.portfolioSize || '');
  const [communicationStyle, setCommunicationStyle] = useState<'formal' | 'casual'>('casual');
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationSuggestion[]>([]);
  const [suggestedFeatures, setSuggestedFeatures] = useState<FeatureSuggestion[]>([]);
  const [aiAutomationLevel, setAiAutomationLevel] = useState<'minimal' | 'balanced' | 'full'>('balanced');
  const [acceptedAiTerms, setAcceptedAiTerms] = useState(false);
  
  // Generate AI suggestions based on role and portfolio size
  useEffect(() => {
    if (currentStep === 2 || currentStep === 3) {
      generateAISuggestions();
    }
  }, [currentStep, role, portfolioSize]);
  
  const generateAISuggestions = async () => {
    // In a real implementation, this would call an API to get AI suggestions
    setIsLoadingAISuggestions(true);
    
    // Simulate network delay
    setTimeout(() => {
      // Generate notification suggestions based on role
      if (currentStep === 2) {
        let suggestions: NotificationSuggestion[] = [];
        
        if (role === 'propertyManager') {
          suggestions = [
            { id: '1', type: 'New tenant applications', channel: 'push', frequency: 'immediate', enabled: true },
            { id: '2', type: 'Maintenance requests', channel: 'push', frequency: 'immediate', enabled: true },
            { id: '3', type: 'Lease renewals', channel: 'email', frequency: 'weekly', enabled: true },
            { id: '4', type: 'Payment reminders', channel: 'email', frequency: 'weekly', enabled: true },
            { id: '5', type: 'Market updates', channel: 'email', frequency: 'weekly', enabled: false },
          ];
        } else if (role === 'tenant') {
          suggestions = [
            { id: '1', type: 'Maintenance updates', channel: 'push', frequency: 'immediate', enabled: true },
            { id: '2', type: 'Payment reminders', channel: 'push', frequency: 'immediate', enabled: true },
            { id: '3', type: 'Building announcements', channel: 'push', frequency: 'immediate', enabled: true },
            { id: '4', type: 'Lease expiration', channel: 'email', frequency: 'weekly', enabled: true },
            { id: '5', type: 'Community events', channel: 'email', frequency: 'weekly', enabled: false },
          ];
        } else if (role === 'admin') {
          suggestions = [
            { id: '1', type: 'System alerts', channel: 'push', frequency: 'immediate', enabled: true },
            { id: '2', type: 'User registrations', channel: 'email', frequency: 'daily', enabled: true },
            { id: '3', type: 'Security events', channel: 'push', frequency: 'immediate', enabled: true },
            { id: '4', type: 'Performance reports', channel: 'email', frequency: 'weekly', enabled: true },
            { id: '5', type: 'Audit logs', channel: 'email', frequency: 'daily', enabled: false },
          ];
        }
        
        setNotificationPreferences(suggestions);
      } 
      
      // Generate feature suggestions based on role and portfolio size
      else if (currentStep === 3) {
        let suggestions: FeatureSuggestion[] = [];
        
        if (role === 'propertyManager') {
          suggestions = [
            { 
              id: '1', 
              name: 'AI Tenant Screening', 
              description: 'Automatically screen tenant applications using AI', 
              enabled: true, 
              priority: 'high' 
            },
            { 
              id: '2', 
              name: 'Predictive Maintenance', 
              description: 'Predict maintenance issues before they occur', 
              enabled: true, 
              priority: 'medium' 
            },
            { 
              id: '3', 
              name: 'Automated Responses', 
              description: 'AI-powered responses to common tenant inquiries', 
              enabled: true, 
              priority: 'medium' 
            },
            { 
              id: '4', 
              name: 'Market Analysis', 
              description: 'AI-driven rental market analysis', 
              enabled: portfolioSize === 'large', 
              priority: portfolioSize === 'large' ? 'high' : 'low' 
            },
          ];
        } else if (role === 'tenant') {
          suggestions = [
            { 
              id: '1', 
              name: 'Smart Maintenance Requests', 
              description: 'AI-enhanced maintenance request submission', 
              enabled: true, 
              priority: 'high' 
            },
            { 
              id: '2', 
              name: 'Digital Concierge', 
              description: 'AI assistant for property-related questions', 
              enabled: true, 
              priority: 'medium' 
            },
            { 
              id: '3', 
              name: 'Payment Forecasting', 
              description: 'Predict future expenses based on your payment history', 
              enabled: true, 
              priority: 'medium' 
            },
            { 
              id: '4', 
              name: 'Community Recommendations', 
              description: 'Get AI recommendations for local services', 
              enabled: false, 
              priority: 'low' 
            },
          ];
        } else if (role === 'admin') {
          suggestions = [
            { 
              id: '1', 
              name: 'System Health Monitoring', 
              description: 'AI-powered system performance monitoring', 
              enabled: true, 
              priority: 'high' 
            },
            { 
              id: '2', 
              name: 'User Behavior Analytics', 
              description: 'Analyze user behavior patterns', 
              enabled: true, 
              priority: 'high' 
            },
            { 
              id: '3', 
              name: 'Fraud Detection', 
              description: 'AI-powered fraud detection system', 
              enabled: true, 
              priority: 'high' 
            },
            { 
              id: '4', 
              name: 'Predictive Resource Allocation', 
              description: 'Optimize system resources based on usage patterns', 
              enabled: true, 
              priority: 'medium' 
            },
          ];
        }
        
        setSuggestedFeatures(suggestions);
      }
      
      setIsLoadingAISuggestions(false);
    }, 1500);
  };
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  
  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call an API to update user settings
      await updateUserSettings({
        role,
        portfolioSize,
        communicationStyle,
        notificationPreferences,
        suggestedFeatures: suggestedFeatures.filter(f => f.enabled),
        aiAutomationLevel,
      });
      
      Alert.alert(
        'Setup Complete',
        'Your account has been successfully configured. You can adjust these settings anytime from your profile.',
        [{ text: 'Continue', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      Alert.alert(
        'Setup Failed',
        'There was a problem saving your settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle notification preference
  const toggleNotification = (id: string) => {
    setNotificationPreferences(prev => 
      prev.map(item => 
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };
  
  // Toggle feature suggestion
  const toggleFeature = (id: string) => {
    setSuggestedFeatures(prev => 
      prev.map(item => 
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Your Role</Text>
            <Text style={styles.stepDescription}>
              This helps us personalize your experience and suggest the most relevant features for you.
            </Text>
            
            <RoleSelector
              selectedRole={role}
              onRoleChange={setRole}
              style={styles.roleSelector}
            />
          </View>
        );
        
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Profile Setup</Text>
            <Text style={styles.stepDescription}>
              Tell us a bit more about yourself so we can customize your experience.
            </Text>
            
            {role === 'propertyManager' && (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Property Portfolio Size</Text>
                <View style={styles.radioGroup}>
                  {['small', 'medium', 'large'].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.radioButton,
                        portfolioSize === size && styles.radioButtonSelected,
                      ]}
                      onPress={() => setPortfolioSize(size)}
                    >
                      <Text 
                        style={[
                          styles.radioButtonText,
                          portfolioSize === size && styles.radioButtonTextSelected,
                        ]}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Preferred Communication Style</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    communicationStyle === 'formal' && styles.radioButtonSelected,
                  ]}
                  onPress={() => setCommunicationStyle('formal')}
                >
                  <Text 
                    style={[
                      styles.radioButtonText,
                      communicationStyle === 'formal' && styles.radioButtonTextSelected,
                    ]}
                  >
                    Formal
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    communicationStyle === 'casual' && styles.radioButtonSelected,
                  ]}
                  onPress={() => setCommunicationStyle('casual')}
                >
                  <Text 
                    style={[
                      styles.radioButtonText,
                      communicationStyle === 'casual' && styles.radioButtonTextSelected,
                    ]}
                  >
                    Casual
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
        
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Notification Preferences</Text>
            <Text style={styles.stepDescription}>
              Based on your role as a {role}, we recommend the following notification settings:
            </Text>
            
            {isLoadingAISuggestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Generating AI suggestions...</Text>
              </View>
            ) : (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.aiSuggestionHeader}>
                  <Text style={{ fontWeight: FONTS.weights.bold }}>AI-Suggested</Text> Notification Settings
                </Text>
                
                {notificationPreferences.map((notification) => (
                  <View key={notification.id} style={styles.checkboxRow}>
                    <Checkbox
                      checked={notification.enabled}
                      onPress={() => toggleNotification(notification.id)}
                      label={notification.type}
                    />
                    <Text style={styles.suggestionDetail}>
                      {notification.channel === 'push' ? 'Push' : notification.channel === 'email' ? 'Email' : 'SMS'}{' · '}
                      {notification.frequency === 'immediate' ? 'Immediate' : 
                       notification.frequency === 'daily' ? 'Daily' : 'Weekly'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
        
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>AI Personalization</Text>
            <Text style={styles.stepDescription}>
              Customize how AI assists you in the PropertyAI platform.
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>AI Automation Level</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'full', label: 'Full' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioButton,
                      aiAutomationLevel === option.value && styles.radioButtonSelected,
                    ]}
                    onPress={() => setAiAutomationLevel(option.value as any)}
                  >
                    <Text 
                      style={[
                        styles.radioButtonText,
                        aiAutomationLevel === option.value && styles.radioButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helperText}>
                {aiAutomationLevel === 'minimal' 
                  ? 'AI will only provide suggestions when explicitly requested.'
                  : aiAutomationLevel === 'balanced'
                  ? 'AI will provide occasional suggestions and automate routine tasks.'
                  : 'AI will proactively automate tasks and provide continuous suggestions.'}
              </Text>
            </View>
            
            {isLoadingAISuggestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Analyzing your profile...</Text>
              </View>
            ) : (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.aiSuggestionHeader}>
                  <Text style={{ fontWeight: FONTS.weights.bold }}>AI-Suggested</Text> Features
                </Text>
                
                {suggestedFeatures.map((feature) => (
                  <View key={feature.id} style={styles.featureItem}>
                    <View style={styles.featureHeader}>
                      <Checkbox
                        checked={feature.enabled}
                        onPress={() => toggleFeature(feature.id)}
                        label={feature.name}
                      />
                      <View style={[
                        styles.priorityBadge,
                        feature.priority === 'high' ? styles.priorityHigh :
                        feature.priority === 'medium' ? styles.priorityMedium :
                        styles.priorityLow
                      ]}>
                        <Text style={styles.priorityText}>{feature.priority}</Text>
                      </View>
                    </View>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <Checkbox
              checked={acceptedAiTerms}
              onPress={() => setAcceptedAiTerms(!acceptedAiTerms)}
              label="I understand that AI features use my data to provide personalized recommendations and automate tasks."
              containerStyle={styles.termsCheckbox}
            />
          </View>
        );
        
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Setup Summary</Text>
            <Text style={styles.stepDescription}>
              Review your configuration before finalizing your setup.
            </Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summarySection}>Role</Text>
              <Text style={styles.summaryValue}>{role}</Text>
              
              {role === 'propertyManager' && (
                <>
                  <Text style={styles.summarySection}>Portfolio Size</Text>
                  <Text style={styles.summaryValue}>{portfolioSize}</Text>
                </>
              )}
              
              <Text style={styles.summarySection}>Communication Style</Text>
              <Text style={styles.summaryValue}>{communicationStyle}</Text>
              
              <Text style={styles.summarySection}>AI Automation Level</Text>
              <Text style={styles.summaryValue}>{aiAutomationLevel}</Text>
              
              <Text style={styles.summarySection}>Enabled Notifications</Text>
              <View style={styles.summaryList}>
                {notificationPreferences
                  .filter(n => n.enabled)
                  .map(n => (
                    <Text key={n.id} style={styles.summaryListItem}>• {n.type}</Text>
                  ))
                }
              </View>
              
              <Text style={styles.summarySection}>Enabled AI Features</Text>
              <View style={styles.summaryList}>
                {suggestedFeatures
                  .filter(f => f.enabled)
                  .map(f => (
                    <Text key={f.id} style={styles.summaryListItem}>• {f.name}</Text>
                  ))
                }
              </View>
            </View>
            
            <Text style={styles.summaryNote}>
              You can modify these settings at any time from your profile.
            </Text>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Setup Wizard</Text>
          
          <View style={styles.aiIndicator}>
            <Text style={styles.aiIndicatorText}>AI-Guided</Text>
          </View>
        </View>
        
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepPress={(step) => currentStep > step && setCurrentStep(step)}
          allowStepSkip={false}
        />
        
        {renderStepContent()}
        
        <View style={styles.buttonContainer}>
          <Button
            title={currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
            onPress={handleNext}
            disabled={
              isSubmitting || 
              isLoadingAISuggestions || 
              (currentStep === 3 && !acceptedAiTerms)
            }
            style={styles.continueButton}
          />
          
          {isSubmitting && (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.submitIndicator}
            />
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold as '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium as '500',
    color: COLORS.primary,
  },
  aiIndicator: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  aiIndicatorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium as '500',
  },
  stepContent: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  stepTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold as '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  roleSelector: {
    marginTop: SPACING.md,
  },
  buttonContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  continueButton: {
    marginTop: SPACING.md,
  },
  submitIndicator: {
    marginTop: SPACING.sm,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium as '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  radioButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  radioButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium as '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  suggestionsContainer: {
    marginTop: SPACING.md,
  },
  aiSuggestionHeader: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  suggestionDetail: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
  },
  featureItem: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    marginLeft: 24, // Aligned with checkbox label
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityHigh: {
    backgroundColor: `${COLORS.primary}20`,
  },
  priorityMedium: {
    backgroundColor: `${COLORS.secondary}20`,
  },
  priorityLow: {
    backgroundColor: `${COLORS.border}60`,
  },
  priorityText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium as '500',
  },
  termsCheckbox: {
    marginTop: SPACING.lg,
  },
  helperText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 8,
    marginVertical: SPACING.md,
  },
  summarySection: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold as '600',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    textTransform: 'capitalize',
  },
  summaryList: {
    marginTop: SPACING.xs,
  },
  summaryListItem: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  summaryNote: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default AIGuidedSetupWizardScreen; 