import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  PrivacySettings as PrivacySettingsType,
  privacySettingsCategories,
  defaultPrivacySettings,
  fetchPrivacySettings,
  updatePrivacySettings,
  dataCollectionLevels,
  getImpactDescription
} from '@/services/privacyService';

interface ImpactIndicatorProps {
  level: 'high' | 'medium' | 'low';
  type: 'data' | 'experience';
}

// Component for displaying impact levels visually
const ImpactIndicator: React.FC<ImpactIndicatorProps> = ({ level, type }) => {
  const getColor = () => {
    if (type === 'data') {
      switch (level) {
        case 'high': return '#dc3545'; // Red for high data impact (privacy concern)
        case 'medium': return '#fd7e14'; // Orange for medium
        case 'low': return '#28a745'; // Green for low (privacy friendly)
        default: return '#6c757d';
      }
    } else {
      switch (level) {
        case 'high': return '#28a745'; // Green for high experience impact (good UX)
        case 'medium': return '#fd7e14'; // Orange for medium
        case 'low': return '#dc3545'; // Red for low (poor UX)
        default: return '#6c757d';
      }
    }
  };

  return (
    <View style={styles.impactContainer}>
      <View style={styles.impactLabelContainer}>
        <Text style={styles.impactLabel}>
          {type === 'data' ? 'Data Impact:' : 'UX Impact:'}
        </Text>
      </View>
      <View style={styles.impactBars}>
        <View style={[
          styles.impactBar, 
          { backgroundColor: level === 'low' || level === 'medium' || level === 'high' ? getColor() : '#e9ecef' }
        ]} />
        <View style={[
          styles.impactBar, 
          { backgroundColor: level === 'medium' || level === 'high' ? getColor() : '#e9ecef' }
        ]} />
        <View style={[
          styles.impactBar, 
          { backgroundColor: level === 'high' ? getColor() : '#e9ecef' }
        ]} />
      </View>
      <Text style={styles.impactDescription}>
        {getImpactDescription(level, type)}
      </Text>
    </View>
  );
};

// Component for displaying a single privacy setting
interface PrivacySettingItemProps {
  category: typeof privacySettingsCategories[0];
  value: boolean | 'minimal' | 'standard' | 'full';
  onToggle: (id: string, value: boolean | string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const PrivacySettingItem: React.FC<PrivacySettingItemProps> = ({
  category,
  value,
  onToggle,
  isExpanded,
  onToggleExpand
}) => {
  const isBoolean = typeof value === 'boolean';
  
  const handleToggle = () => {
    if (isBoolean) {
      onToggle(category.id as string, !value);
    }
  };

  const handleDataCollectionChange = (level: 'minimal' | 'standard' | 'full') => {
    onToggle('dataCollection', level);
  };

  return (
    <Card style={styles.settingCard}>
      <Card.Title title={category.title} />
      <Card.Content>
        <Text style={styles.settingDescription}>{category.description}</Text>
        
        <TouchableOpacity onPress={onToggleExpand} style={styles.detailsToggle}>
          <Text style={styles.detailsToggleText}>
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedDetails}>
            <ImpactIndicator 
              level={category.dataImpact} 
              type="data" 
            />
            <ImpactIndicator 
              level={category.userExperienceImpact} 
              type="experience" 
            />
            
            {category.id === 'dataCollection' && (
              <View style={styles.dataCollectionInfo}>
                <Text style={styles.dataCollectionTitle}>Selected: {dataCollectionLevels[value as 'minimal' | 'standard' | 'full'].title}</Text>
                <Text style={styles.dataCollectionDescription}>{dataCollectionLevels[value as 'minimal' | 'standard' | 'full'].description}</Text>
                
                <View style={styles.collectedDataContainer}>
                  <Text style={styles.collectedDataTitle}>Data Collected:</Text>
                  {dataCollectionLevels[value as 'minimal' | 'standard' | 'full'].dataCollected.map((item, index) => (
                    <Text key={index} style={styles.collectedDataItem}>• {item}</Text>
                  ))}
                </View>

                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Features Enabled:</Text>
                  {dataCollectionLevels[value as 'minimal' | 'standard' | 'full'].features.map((item, index) => (
                    <Text key={index} style={styles.featureItem}>• {item}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Card.Content>

      {category.id === 'dataCollection' ? (
        <Card.Actions>
          <View style={styles.optionRow}>
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                value === 'minimal' && styles.selectedOption
              ]}
              onPress={() => handleDataCollectionChange('minimal')}
            >
              <Text style={styles.optionText}>Minimal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                value === 'standard' && styles.selectedOption
              ]}
              onPress={() => handleDataCollectionChange('standard')}
            >
              <Text style={styles.optionText}>Standard</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.optionButton, 
                value === 'full' && styles.selectedOption
              ]}
              onPress={() => handleDataCollectionChange('full')}
            >
              <Text style={styles.optionText}>Full</Text>
            </TouchableOpacity>
          </View>
        </Card.Actions>
      ) : (
        <Card.Actions>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>{isBoolean && value ? 'Enabled' : 'Disabled'}</Text>
            <Switch
              value={isBoolean ? value : false}
              onValueChange={handleToggle}
              disabled={category.isRequired}
              trackColor={{ false: '#d1d1d1', true: '#aed6f1' }}
              thumbColor={isBoolean && value ? '#0066cc' : '#f4f3f4'}
            />
          </View>
        </Card.Actions>
      )}

      {category.isRequired && (
        <View style={styles.requiredBadgeContainer}>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredBadgeText}>Required</Text>
          </View>
        </View>
      )}
    </Card>
  );
};

// Main component for privacy settings
export const PrivacySettings: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsType>(defaultPrivacySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Fetch privacy settings on component mount
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const settings = await fetchPrivacySettings();
        setPrivacySettings(settings);
      } catch (error) {
        console.error('Error loading privacy settings:', error);
        Alert.alert('Error', 'Failed to load your privacy settings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPrivacySettings();
  }, []);

  // Toggle expanded state for a setting
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle setting toggle or change
  const handleSettingChange = (id: string, value: boolean | string) => {
    if (id.includes('.')) {
      // Handle nested settings like cookieSettings.functional
      const [parent, child] = id.split('.');
      
      setPrivacySettings(prev => {
        // Create a properly typed copy
        const updatedSettings: PrivacySettingsType = { ...prev };
        
        // Update the nested property safely
        if (parent === 'cookieSettings' && 
            (child === 'essential' || child === 'functional' || 
             child === 'analytics' || child === 'advertising')) {
          updatedSettings.cookieSettings = {
            ...updatedSettings.cookieSettings,
            [child]: value as boolean
          };
        }
        
        return updatedSettings;
      });
    } else {
      // Handle top-level settings safely with proper typing
      setPrivacySettings(prev => {
        const updatedSettings = { ...prev };
        
        // Type guard to ensure we only set valid properties
        if (id in updatedSettings) {
          // Type-safe approach to handle different types of settings
          if (id === 'dataCollection' && 
              (value === 'minimal' || value === 'standard' || value === 'full')) {
            updatedSettings.dataCollection = value;
          } else if (id === 'locationTracking' || id === 'deviceInfo' || 
                     id === 'searchHistory' || id === 'thirdPartySharing' || 
                     id === 'adPersonalization' || id === 'profileIndexing') {
            // These are all boolean settings
            updatedSettings[id] = value as boolean;
          }
        }
        
        return updatedSettings;
      });
    }
  };

  // Save privacy settings
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      await updatePrivacySettings(privacySettings);
      Alert.alert('Success', 'Your privacy settings have been saved successfully.');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save your privacy settings. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your privacy settings...</Text>
      </View>
    );
  }

  // Group settings by category
  const mainSettings = privacySettingsCategories.filter(category => !category.parentCategory);
  const cookieSettings = privacySettingsCategories.filter(category => category.parentCategory === 'cookieSettings');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Privacy Settings</Text>
      <Text style={styles.sectionDescription}>
        Configure your privacy preferences to control how your data is collected and used.
        These settings affect how our app functions and the personalization you receive.
      </Text>

      <Text style={styles.categoryTitle}>General Privacy Settings</Text>
      {mainSettings.map((category) => (
        <PrivacySettingItem
          key={category.id}
          category={category}
          value={privacySettings[category.id as keyof PrivacySettingsType] as boolean | 'minimal' | 'standard' | 'full'}
          onToggle={handleSettingChange}
          isExpanded={!!expandedItems[category.id as string]}
          onToggleExpand={() => toggleExpanded(category.id as string)}
        />
      ))}

      <Text style={styles.categoryTitle}>Cookie Settings</Text>
      {cookieSettings.map((category) => (
        <PrivacySettingItem
          key={category.id}
          category={category}
          value={privacySettings.cookieSettings[category.id as keyof typeof privacySettings.cookieSettings]}
          onToggle={(id, value) => handleSettingChange(`cookieSettings.${id}`, value)}
          isExpanded={!!expandedItems[category.id as string]}
          onToggleExpand={() => toggleExpanded(category.id as string)}
        />
      ))}

      <Button 
        mode="contained" 
        style={styles.saveButton}
        onPress={saveSettings}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Changes to these settings may affect how our services work for you. For more information, please see our{' '}
          <Text style={styles.linkText}>Privacy Policy</Text>.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#212529',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 22,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#212529',
  },
  settingCard: {
    marginBottom: 16,
    elevation: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsToggle: {
    marginTop: 8,
    marginBottom: 12,
  },
  detailsToggleText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  expandedDetails: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  impactContainer: {
    marginBottom: 12,
  },
  impactLabelContainer: {
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  impactBars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  impactBar: {
    height: 8,
    flex: 1,
    marginRight: 4,
    borderRadius: 4,
  },
  impactDescription: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#495057',
  },
  requiredBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  requiredBadge: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#0066cc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  optionButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#e6f2ff',
    borderColor: '#0066cc',
  },
  optionText: {
    fontSize: 14,
    color: '#212529',
  },
  dataCollectionInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dataCollectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#212529',
  },
  dataCollectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  collectedDataContainer: {
    marginBottom: 12,
  },
  collectedDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  collectedDataItem: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  featuresContainer: {
    marginBottom: 4,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  featureItem: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  footer: {
    marginTop: 32,
    marginBottom: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  footerText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
}); 