import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ConsentPreferences,
  ConsentDescription,
  consentDescriptions,
  defaultConsentPreferences,
  fetchConsentPreferences,
  updateConsentPreferences,
  getConsentHistory
} from '@/services/consentService';

interface ConsentItemProps {
  item: ConsentDescription;
  isEnabled: boolean;
  onToggle: (id: keyof ConsentPreferences) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Component for displaying a single consent item
const ConsentItem: React.FC<ConsentItemProps> = ({ 
  item, 
  isEnabled, 
  onToggle,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <Card style={styles.consentCard}>
      <Card.Title title={item.title} />
      <Card.Content>
        <Text style={styles.consentDescription}>{item.description}</Text>

        <TouchableOpacity onPress={onToggleExpand} style={styles.detailsToggle}>
          <Text style={styles.detailsToggleText}>
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Importance:</Text>
              <Text style={[
                styles.detailValue, 
                item.importance === 'essential' ? styles.essentialLabel : 
                item.importance === 'functional' ? styles.functionalLabel : 
                styles.optionalLabel
              ]}>
                {item.importance.charAt(0).toUpperCase() + item.importance.slice(1)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Categories:</Text>
              <View style={styles.categoriesContainer}>
                {item.dataCategories.map((category, index) => (
                  <Text key={index} style={styles.category}>• {category}</Text>
                ))}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Retention Period:</Text>
              <Text style={styles.detailValue}>{item.retention}</Text>
            </View>
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <Button
          mode={isEnabled ? "contained" : "outlined"}
          onPress={() => onToggle(item.id)}
        >
          {isEnabled ? 'Enabled' : 'Disabled'}
        </Button>
      </Card.Actions>
    </Card>
  );
};

// The main consent management component
export const ConsentManagement: React.FC = () => {
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences>(defaultConsentPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [consentHistory, setConsentHistory] = useState<Array<{
    timestamp: string;
    changes: Partial<ConsentPreferences>;
    ipAddress: string;
    device: string;
  }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch consent preferences on component mount
  useEffect(() => {
    const loadConsentPreferences = async () => {
      try {
        const preferences = await fetchConsentPreferences();
        setConsentPreferences(preferences);
      } catch (error) {
        console.error('Error loading consent preferences:', error);
        Alert.alert('Error', 'Failed to load your consent preferences. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadConsentPreferences();
  }, []);

  // Load consent history when showHistory is toggled
  useEffect(() => {
    if (showHistory) {
      const loadConsentHistory = async () => {
        try {
          const history = await getConsentHistory();
          setConsentHistory(history);
        } catch (error) {
          console.error('Error loading consent history:', error);
          Alert.alert('Error', 'Failed to load your consent history. Please try again later.');
        }
      };

      loadConsentHistory();
    }
  }, [showHistory]);

  // Toggle consent for a specific item
  const toggleConsent = (id: keyof ConsentPreferences) => {
    setConsentPreferences(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle expanded state for a consent item
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Save consent preferences
  const savePreferences = async () => {
    setIsSaving(true);
    
    try {
      await updateConsentPreferences(consentPreferences);
      Alert.alert('Success', 'Your consent preferences have been saved successfully.');
    } catch (error) {
      console.error('Error saving consent preferences:', error);
      Alert.alert('Error', 'Failed to save your consent preferences. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your consent preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Consent Management</Text>
      <Text style={styles.sectionDescription}>
        Control how your data is used by managing your consent preferences. Your privacy is important to us.
      </Text>

      {consentDescriptions.map((item) => (
        <ConsentItem
          key={item.id}
          item={item}
          isEnabled={consentPreferences[item.id]}
          onToggle={toggleConsent}
          isExpanded={!!expandedItems[item.id]}
          onToggleExpand={() => toggleExpanded(item.id)}
        />
      ))}

      <Button 
        mode="contained" 
        style={styles.saveButton}
        onPress={savePreferences}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </Button>

      <TouchableOpacity 
        style={styles.historyToggle}
        onPress={() => setShowHistory(!showHistory)}
      >
        <Text style={styles.historyToggleText}>
          {showHistory ? 'Hide Consent History' : 'View Consent History'}
        </Text>
      </TouchableOpacity>

      {showHistory && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Consent Change History</Text>
          
          {consentHistory.length === 0 ? (
            <Text style={styles.noHistoryText}>No history available.</Text>
          ) : (
            consentHistory.map((item, index) => (
              <Card key={index} style={styles.historyCard}>
                <Card.Content>
                  <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
                  <Text style={styles.historyDevice}>Device: {item.device}</Text>
                  <Text style={styles.historyChanges}>Changes:</Text>
                  {Object.entries(item.changes).map(([key, value]) => (
                    <Text key={key} style={styles.changeItem}>
                      • {consentDescriptions.find(desc => desc.id === key)?.title || key}: 
                      <Text style={value ? styles.enabledText : styles.disabledText}>
                        {value ? ' Enabled' : ' Disabled'}
                      </Text>
                    </Text>
                  ))}
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can change your consent preferences at any time. For more information, please see our{' '}
          <Text style={styles.linkText}>Privacy Policy</Text>.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  consentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  consentDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
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
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#6c757d',
  },
  essentialLabel: {
    color: '#dc3545',
  },
  functionalLabel: {
    color: '#fd7e14',
  },
  optionalLabel: {
    color: '#28a745',
  },
  categoriesContainer: {
    marginTop: 4,
  },
  category: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  historyToggle: {
    marginTop: 24,
    alignItems: 'center',
    padding: 8,
  },
  historyToggleText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  historyCard: {
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  historyDevice: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  historyChanges: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  changeItem: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  enabledText: {
    color: '#28a745',
  },
  disabledText: {
    color: '#dc3545',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
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