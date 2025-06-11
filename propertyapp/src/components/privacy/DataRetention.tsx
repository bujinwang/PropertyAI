import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  FlatList
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { 
  DataType,
  RetentionPeriodType,
  RetentionTrigger,
  LegalBasis,
  StorageLocation,
  RetentionPolicy,
  RetentionStatistics,
  RetentionDataItem,
  dataTypeInfo,
  legalBasisInfo,
  getRetentionPolicies,
  getRetentionStatistics,
  getRetentionDataItems,
  requestEarlyDeletion,
  getRetentionComplianceInfo
} from '@/services/dataRetentionService';

// Helper function to format retention period
const formatRetentionPeriod = (policy: RetentionPolicy): string => {
  const { type, duration, customDescription } = policy.retentionPeriod;
  
  switch (type) {
    case RetentionPeriodType.PERMANENT:
      return 'Permanently stored';
    case RetentionPeriodType.YEARS:
      return `${duration} year${duration === 1 ? '' : 's'}`;
    case RetentionPeriodType.MONTHS:
      return `${duration} month${duration === 1 ? '' : 's'}`;
    case RetentionPeriodType.DAYS:
      return `${duration} day${duration === 1 ? '' : 's'}`;
    case RetentionPeriodType.UNTIL_ACCOUNT_CLOSURE:
      return 'Until account closure';
    case RetentionPeriodType.CUSTOM:
      return customDescription || 'Custom retention period';
    default:
      return 'Unknown';
  }
};

// Helper function to format trigger
const formatTrigger = (trigger: RetentionTrigger): string => {
  switch (trigger) {
    case RetentionTrigger.COLLECTION:
      return 'From time of collection';
    case RetentionTrigger.LAST_USE:
      return 'From time of last use';
    case RetentionTrigger.ACCOUNT_DELETION:
      return 'After account deletion';
    case RetentionTrigger.CONTRACT_END:
      return 'After contract/lease ends';
    case RetentionTrigger.SPECIFIC_EVENT:
      return 'After a specific event';
    default:
      return 'Unknown';
  }
};

// Helper function to get sensitivity color
const getSensitivityColor = (sensitivity: 'high' | 'medium' | 'low'): string => {
  switch (sensitivity) {
    case 'high':
      return '#dc3545'; // Red
    case 'medium':
      return '#fd7e14'; // Orange
    case 'low':
      return '#28a745'; // Green
    default:
      return '#6c757d'; // Gray
  }
};

// Component for sensitivity badge
interface SensitivityBadgeProps {
  sensitivity: 'high' | 'medium' | 'low';
}

const SensitivityBadge: React.FC<SensitivityBadgeProps> = ({ sensitivity }) => (
  <View style={[styles.sensitivityBadge, { backgroundColor: getSensitivityColor(sensitivity) }]}>
    <Text style={styles.sensitivityText}>{sensitivity.toUpperCase()}</Text>
  </View>
);

// Component for policy card
interface PolicyCardProps {
  policy: RetentionPolicy;
  expanded: boolean;
  onToggleExpand: () => void;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, expanded, onToggleExpand }) => {
  const typeInfo = dataTypeInfo[policy.dataType];
  const basisInfo = legalBasisInfo[policy.legalBasis];
  
  return (
    <Card style={styles.policyCard}>
      <Card.Title 
        title={typeInfo.title}
        subtitle={formatRetentionPeriod(policy)}
        right={() => <SensitivityBadge sensitivity={typeInfo.sensitivity} />}
      />
      <Card.Content>
        <Text style={styles.policyDescription}>{policy.description}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Retention Period:</Text>
          <Text style={styles.infoValue}>
            {formatRetentionPeriod(policy)} ({formatTrigger(policy.trigger)})
          </Text>
        </View>
        
        <TouchableOpacity onPress={onToggleExpand} style={styles.expandButton}>
          <Text style={styles.expandButtonText}>
            {expanded ? 'Hide Details' : 'Show Details'}
          </Text>
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Legal Basis:</Text>
              <Text style={styles.infoValue}>{basisInfo.title}</Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>What This Means</Text>
              <Text style={styles.infoSectionText}>{basisInfo.description}</Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Examples of Data</Text>
              <View style={styles.examplesList}>
                {typeInfo.examples.map((example, index) => (
                  <Text key={`example-${index}`} style={styles.exampleItem}>• {example}</Text>
                ))}
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Storage Location:</Text>
              <Text style={styles.infoValue}>{policy.storageLocation.replace('_', ' ')}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Auto-Delete:</Text>
              <Text style={styles.infoValue}>
                {policy.autoDeleteEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Early Deletion:</Text>
              <Text style={styles.infoValue}>
                {policy.canRequestEarlyDeletion ? 'Available' : 'Not Available'}
              </Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Applicable Regulations</Text>
              <View style={styles.regulationsList}>
                {typeInfo.regulations.map((regulation, index) => (
                  <View key={`regulation-${index}`} style={styles.regulationBadge}>
                    <Text style={styles.regulationText}>{regulation}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

// Component for data item card
interface DataItemCardProps {
  item: RetentionDataItem;
  onRequestDeletion: () => void;
}

const DataItemCard: React.FC<DataItemCardProps> = ({ item, onRequestDeletion }) => {
  const typeInfo = dataTypeInfo[item.dataType];
  const formattedCollectionDate = item.collectionDate.toLocaleDateString();
  const formattedLastUsedDate = item.lastUsedDate?.toLocaleDateString() || 'N/A';
  const formattedExpiryDate = item.expiryDate?.toLocaleDateString() || 'N/A';
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#28a745'; // Green
      case 'pending_deletion':
        return '#fd7e14'; // Orange
      case 'archived':
        return '#6c757d'; // Gray
      default:
        return '#6c757d';
    }
  };
  
  return (
    <Card style={styles.dataItemCard}>
      <Card.Title 
        title={item.description}
        subtitle={typeInfo.title}
        right={() => (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        )}
      />
      <Card.Content>
        <View style={styles.dataItemContent}>
          <View style={styles.dataItemRow}>
            <Text style={styles.dataItemLabel}>Collection Date:</Text>
            <Text style={styles.dataItemValue}>{formattedCollectionDate}</Text>
          </View>
          
          <View style={styles.dataItemRow}>
            <Text style={styles.dataItemLabel}>Last Used:</Text>
            <Text style={styles.dataItemValue}>{formattedLastUsedDate}</Text>
          </View>
          
          <View style={styles.dataItemRow}>
            <Text style={styles.dataItemLabel}>Expiry Date:</Text>
            <Text style={styles.dataItemValue}>{formattedExpiryDate}</Text>
          </View>
          
          <View style={styles.dataItemRow}>
            <Text style={styles.dataItemLabel}>Storage:</Text>
            <Text style={styles.dataItemValue}>
              {item.storageLocation.replace('_', ' ')} ({item.size})
            </Text>
          </View>
        </View>
      </Card.Content>
      
      {item.status === 'active' && (
        <Card.Actions>
          <Button
            mode="outlined"
            onPress={onRequestDeletion}
            style={styles.deletionButton}
          >
            Request Early Deletion
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
};

// Main component
export const DataRetention: React.FC = () => {
  // State
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [statistics, setStatistics] = useState<RetentionStatistics | null>(null);
  const [dataItems, setDataItems] = useState<RetentionDataItem[]>([]);
  const [complianceInfo, setComplianceInfo] = useState<{
    compliant: boolean;
    regulations: string[];
    lastUpdated: Date;
    nextReview: Date;
    recommendations: string[];
  } | null>(null);
  const [expandedPolicies, setExpandedPolicies] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'policies' | 'data'>('policies');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPolicies, fetchedStatistics, fetchedDataItems, fetchedComplianceInfo] = await Promise.all([
          getRetentionPolicies(),
          getRetentionStatistics(),
          getRetentionDataItems(),
          getRetentionComplianceInfo()
        ]);
        
        setPolicies(fetchedPolicies);
        setStatistics(fetchedStatistics);
        setDataItems(fetchedDataItems);
        setComplianceInfo(fetchedComplianceInfo);
      } catch (error) {
        console.error('Error fetching retention data:', error);
        Alert.alert('Error', 'Failed to load data retention information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Toggle policy expansion
  const togglePolicyExpand = (dataType: DataType) => {
    setExpandedPolicies(prev => ({
      ...prev,
      [dataType]: !prev[dataType]
    }));
  };
  
  // Handle early deletion request
  const handleRequestDeletion = (itemId: string) => {
    Alert.alert(
      'Request Early Deletion',
      'Are you sure you want to request early deletion of this data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await requestEarlyDeletion(itemId);
              
              if (success) {
                // Update local state
                setDataItems(prev => 
                  prev.map(item => 
                    item.id === itemId 
                      ? { ...item, status: 'pending_deletion' as const } 
                      : item
                  )
                );
                
                Alert.alert('Success', 'Your deletion request has been submitted successfully.');
              } else {
                Alert.alert('Error', 'Failed to submit deletion request. Please try again later.');
              }
            } catch (error) {
              console.error('Error requesting deletion:', error);
              Alert.alert('Error', 'An error occurred while submitting your request.');
            }
          }
        }
      ]
    );
  };
  
  // Render statistics section
  const renderStatistics = () => {
    if (!statistics) return null;
    
    return (
      <View style={styles.statisticsContainer}>
        <View style={styles.statisticItem}>
          <Text style={styles.statisticValue}>{statistics.totalDataTypes}</Text>
          <Text style={styles.statisticLabel}>Data Types</Text>
        </View>
        
        <View style={styles.statisticItem}>
          <Text style={styles.statisticValue}>
            {statistics.averageRetentionPeriodInDays > 365
              ? `${Math.round(statistics.averageRetentionPeriodInDays / 365)} yrs`
              : `${statistics.averageRetentionPeriodInDays} days`}
          </Text>
          <Text style={styles.statisticLabel}>Avg. Retention</Text>
        </View>
        
        <View style={styles.statisticItem}>
          <Text style={styles.statisticValue}>{statistics.dataTypesWithAutoDelete}</Text>
          <Text style={styles.statisticLabel}>Auto-Delete</Text>
        </View>
      </View>
    );
  };
  
  // Render compliance section
  const renderComplianceInfo = () => {
    if (!complianceInfo) return null;
    
    return (
      <Card style={styles.complianceCard}>
        <Card.Title 
          title="Compliance Status" 
          right={() => (
            <View style={styles.complianceStatusContainer}>
              <MaterialIcons 
                name={complianceInfo.compliant ? "check-circle" : "warning"} 
                size={24} 
                color={complianceInfo.compliant ? "#28a745" : "#ffc107"} 
              />
            </View>
          )}
        />
        <Card.Content>
          <Text style={styles.complianceStatus}>
            {complianceInfo.compliant 
              ? 'Your data retention policies are compliant with applicable regulations.' 
              : 'Some retention policies may need review to ensure full compliance.'}
          </Text>
          
          <View style={styles.complianceInfo}>
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>Regulations:</Text>
              <View style={styles.regulationsList}>
                {complianceInfo.regulations.map((regulation, index) => (
                  <View key={`compliance-reg-${index}`} style={styles.regulationBadge}>
                    <Text style={styles.regulationText}>{regulation}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>Last Review:</Text>
              <Text style={styles.complianceValue}>
                {complianceInfo.lastUpdated.toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.complianceRow}>
              <Text style={styles.complianceLabel}>Next Review:</Text>
              <Text style={styles.complianceValue}>
                {complianceInfo.nextReview.toLocaleDateString()}
              </Text>
            </View>
            
            {complianceInfo.recommendations.length > 0 && (
              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>Recommendations</Text>
                {complianceInfo.recommendations.map((rec, index) => (
                  <Text key={`rec-${index}`} style={styles.recommendationItem}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading data retention policies...</Text>
      </View>
    );
  }
  
  // Render main component
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Data Retention Policies</Text>
      <Text style={styles.sectionDescription}>
        View how long we store different types of your data and the legal basis for retention.
      </Text>
      
      {renderStatistics()}
      {renderComplianceInfo()}
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'policies' && styles.activeTab]}
          onPress={() => setActiveTab('policies')}
        >
          <Text style={[styles.tabText, activeTab === 'policies' && styles.activeTabText]}>
            Retention Policies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'data' && styles.activeTab]}
          onPress={() => setActiveTab('data')}
        >
          <Text style={[styles.tabText, activeTab === 'data' && styles.activeTabText]}>
            Your Data ({dataItems.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'policies' ? (
        <FlatList
          data={policies}
          keyExtractor={(item) => item.dataType}
          renderItem={({ item }) => (
            <PolicyCard
              policy={item}
              expanded={!!expandedPolicies[item.dataType]}
              onToggleExpand={() => togglePolicyExpand(item.dataType)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="exclamation-circle" size={48} color="#6c757d" />
              <Text style={styles.emptyStateText}>No retention policies found.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={dataItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DataItemCard
              item={item}
              onRequestDeletion={() => handleRequestDeletion(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome name="database" size={48} color="#6c757d" />
              <Text style={styles.emptyStateText}>No data items found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 16,
    color: '#6c757d',
    lineHeight: 22,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statisticItem: {
    alignItems: 'center',
    flex: 1,
  },
  statisticValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  statisticLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  complianceCard: {
    marginBottom: 16,
  },
  complianceStatusContainer: {
    marginRight: 16,
  },
  complianceStatus: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 12,
  },
  complianceInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  complianceRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  complianceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    width: 120,
  },
  complianceValue: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  regulationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  regulationBadge: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  regulationText: {
    fontSize: 12,
    color: '#495057',
  },
  recommendationsSection: {
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 16,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  policyCard: {
    marginBottom: 16,
  },
  policyDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  sensitivityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 16,
  },
  sensitivityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  expandButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#0066cc',
  },
  expandedContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoSection: {
    marginBottom: 12,
    marginTop: 4,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  infoSectionText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  examplesList: {
    marginLeft: 8,
  },
  exampleItem: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  dataItemCard: {
    marginBottom: 16,
  },
  dataItemContent: {
    marginBottom: 8,
  },
  dataItemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dataItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    width: 120,
  },
  dataItemValue: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deletionButton: {
    borderColor: '#dc3545',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
}); 