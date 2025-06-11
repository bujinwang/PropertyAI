import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIDataUsage, AIUsageCategory, DataProcessingType } from '../../types/privacy';
import { aiTransparencyService } from '../../services/aiTransparencyService';
import { useAuth } from '../../contexts/AuthContext';

// Define colors to avoid importing from a non-existent file
const colors = {
  primary: '#0066cc',
  text: '#212529',
  textLight: '#6c757d',
  background: '#ffffff',
  lightBackground: '#f8f9fa',
  white: '#ffffff',
  gray: '#adb5bd',
  error: '#dc3545',
};

const AIDataTransparency: React.FC = () => {
  const { user, updateUserSettings } = useAuth();
  const [dataUsage, setDataUsage] = useState<AIDataUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [modelOptOut, setModelOptOut] = useState(false);

  useEffect(() => {
    fetchDataUsage();
  }, []);

  const fetchDataUsage = async () => {
    try {
      setLoading(true);
      const data = await aiTransparencyService.getAIDataUsage();
      setDataUsage(data);
      setModelOptOut(data.modelTrainingPolicy.isOptedOut);
      
      // Initialize expanded state
      const categories: Record<string, boolean> = {};
      const types: Record<string, boolean> = {};
      
      data.categories.forEach((category: AIUsageCategory) => {
        categories[category.id] = false;
        category.processingTypes.forEach((type: DataProcessingType) => {
          types[`${category.id}-${type.id}`] = false;
        });
      });
      
      setExpandedCategories(categories);
      setExpandedTypes(types);
      
      setError(null);
    } catch (err) {
      setError('Failed to load AI data usage information. Please try again later.');
      console.error('Error fetching AI data usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleProcessingType = (categoryId: string, typeId: string) => {
    const key = `${categoryId}-${typeId}`;
    setExpandedTypes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleProcessing = async (
    categoryId: string, 
    processingTypeId: string, 
    currentValue: boolean
  ) => {
    try {
      const result = await aiTransparencyService.updateAIProcessingSettings(
        categoryId,
        processingTypeId,
        !currentValue
      );
      
      if (result.success) {
        // Update local state
        setDataUsage(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            categories: prev.categories.map(category => {
              if (category.id !== categoryId) return category;
              
              return {
                ...category,
                processingTypes: category.processingTypes.map(type => {
                  if (type.id !== processingTypeId) return type;
                  return { ...type, isEnabled: !currentValue };
                })
              };
            })
          };
        });

        // Also update user settings in the AuthContext
        // In a real app, we would map these settings to the user's settings schema
        if (user && user.settings) {
          const settingKey = `ai_${categoryId}_${processingTypeId}`;
          await updateUserSettings({
            privacy: {
              ...user.settings.privacy,
              // Use a dynamic property to update the specific AI setting
              // This is a simplified example - in a real app, this would be more structured
              [settingKey as keyof typeof user.settings.privacy]: !currentValue
            }
          });
        }
      }
    } catch (err) {
      console.error('Error updating processing settings:', err);
      // Show error toast/message here
    }
  };

  const handleToggleModelOptOut = async () => {
    try {
      const newValue = !modelOptOut;
      const result = await aiTransparencyService.updateModelTrainingOptOut(newValue);
      
      if (result.success) {
        setModelOptOut(newValue);
        
        // Update local state
        setDataUsage(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            modelTrainingPolicy: {
              ...prev.modelTrainingPolicy,
              isOptedOut: newValue
            }
          };
        });

        // Also update user settings in the AuthContext
        if (user && user.settings) {
          await updateUserSettings({
            privacy: {
              ...user.settings.privacy,
              // In a real app, we would use a proper key for this setting
              aiModelTrainingOptOut: newValue
            }
          });
        }
      }
    } catch (err) {
      console.error('Error updating model training opt-out:', err);
      // Show error toast/message here
    }
  };

  const renderDataSources = (dataSources: string[]) => {
    return (
      <View style={styles.dataSources}>
        <Text style={styles.subheading}>Data Sources:</Text>
        {dataSources.map((source, index) => (
          <View key={index} style={styles.dataSourceItem}>
            <Ionicons name="ellipse" size={8} color={colors.primary} />
            <Text style={styles.dataSourceText}>{source}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderProcessingType = (category: AIUsageCategory, type: DataProcessingType) => {
    const isExpanded = expandedTypes[`${category.id}-${type.id}`];
    
    return (
      <View key={type.id} style={styles.processingType}>
        <TouchableOpacity 
          style={styles.processingTypeHeader}
          onPress={() => toggleProcessingType(category.id, type.id)}
        >
          <View style={styles.processingTypeTitleContainer}>
            <Ionicons 
              name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
              size={14} 
              color={colors.text}
            />
            <Text style={styles.processingTypeTitle}>{type.name}</Text>
          </View>
          
          {type.isOptional && (
            <Switch
              value={type.isEnabled}
              onValueChange={() => handleToggleProcessing(category.id, type.id, type.isEnabled)}
              trackColor={{ false: colors.gray, true: colors.primary }}
            />
          )}
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.processingTypeDetails}>
            <Text style={styles.processingTypeDescription}>{type.description}</Text>
            
            {renderDataSources(type.dataSources)}
            
            <View style={styles.purposeContainer}>
              <Text style={styles.subheading}>Purpose:</Text>
              <Text style={styles.purposeText}>{type.purposeDescription}</Text>
            </View>
            
            <View style={styles.retentionContainer}>
              <Text style={styles.subheading}>Retention Period:</Text>
              <Text style={styles.retentionText}>{type.retentionPeriod}</Text>
            </View>
            
            {!type.isOptional && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>Required</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCategory = (category: AIUsageCategory) => {
    const isExpanded = expandedCategories[category.id];
    
    return (
      <View key={category.id} style={styles.categoryCard}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.id)}
        >
          <Ionicons 
            name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
            size={16} 
            color={colors.text}
          />
          <Text style={styles.categoryTitle}>{category.name}</Text>
        </TouchableOpacity>
        
        <Text style={styles.categoryDescription}>{category.description}</Text>
        
        {isExpanded && (
          <View style={styles.processingTypesContainer}>
            {category.processingTypes.map(type => renderProcessingType(category, type))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading AI transparency information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDataUsage}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dataUsage) {
    return (
      <View style={styles.centered}>
        <Text>No AI data usage information available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.tabTitle}>AI Data Usage Transparency</Text>
      <Text style={styles.tabDescription}>
        View how AI is used throughout PropertyFlow, what data is collected,
        and control your AI privacy settings.
      </Text>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <Text style={styles.infoText}>
          This section provides transparency about how AI is used throughout the PropertyFlow app,
          what data is collected, how it&apos;s processed, and how you can control it.
        </Text>
      </View>
      
      <View style={styles.lastUpdatedContainer}>
        <Text style={styles.lastUpdatedText}>
          Last updated: {new Date(dataUsage.lastUpdated).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.modelTrainingCard}>
        <Text style={styles.cardTitle}>AI Model Training</Text>
        <View style={styles.divider} />
        <Text style={styles.modelTrainingDescription}>
          {dataUsage.modelTrainingPolicy.description}
        </Text>
        
        {dataUsage.modelTrainingPolicy.optOut && (
          <View style={styles.optOutContainer}>
            <Text style={styles.optOutText}>
              Opt out of contributing anonymized data for model training
            </Text>
            <Switch
              value={modelOptOut}
              onValueChange={handleToggleModelOptOut}
              trackColor={{ false: colors.gray, true: colors.primary }}
            />
          </View>
        )}
      </View>
      
      <Text style={styles.sectionTitle}>AI Features & Data Usage</Text>
      <Text style={styles.sectionDescription}>
        Below is a list of how AI is used in PropertyFlow. You can expand each category to
        learn more about the data used and adjust settings where possible.
      </Text>
      
      {dataUsage.categories.map(renderCategory)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  tabDescription: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    marginTop: 10,
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.lightBackground,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  lastUpdatedContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  modelTrainingCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginBottom: 15,
  },
  modelTrainingDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 15,
    lineHeight: 20,
  },
  optOutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  optOutText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 15,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 5,
    marginLeft: 26,
  },
  processingTypesContainer: {
    marginTop: 15,
    marginLeft: 15,
  },
  processingType: {
    marginBottom: 12,
  },
  processingTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  processingTypeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingTypeTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
  processingTypeDetails: {
    marginLeft: 22,
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.lightBackground,
    borderRadius: 6,
  },
  processingTypeDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  dataSources: {
    marginTop: 10,
  },
  dataSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: 4,
  },
  dataSourceText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 8,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  purposeContainer: {
    marginTop: 10,
  },
  purposeText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginLeft: 10,
  },
  retentionContainer: {
    marginTop: 10,
  },
  retentionText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 10,
  },
  requiredBadge: {
    backgroundColor: colors.gray,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  requiredBadgeText: {
    fontSize: 12,
    color: colors.white,
  },
});

export default AIDataTransparency; 