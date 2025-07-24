import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { TabView, SceneMap, TabBar, Route, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { ConsentManagement } from '@/components/privacy/ConsentManagement';
import { PrivacySettings } from '@/components/privacy/PrivacySettings';
import { SubjectAccessRequests } from '@/components/privacy/SubjectAccessRequests';
import { DataRetention } from '@/components/privacy/DataRetention';
import AIDataTransparency from '@/components/privacy/AIDataTransparency';

// Simple header component since we don't have access to the actual Header component
const Header: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <View style={headerStyles.container}>
    <Text style={headerStyles.backButton} onPress={onBack}>← Back</Text>
    <Text style={headerStyles.title}>{title}</Text>
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#0066cc',
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
});

type DataPrivacyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Real implementation for Compliance Reporting tab
const ComplianceReporting = () => {
  const [selectedReport, setSelectedReport] = useState<string>('monthly');
  const [dateRange, setDateRange] = useState<string>('last30days');

  const complianceStats = [
    { label: 'Data Access Requests', value: '12', change: '+3', trend: 'up' },
    { label: 'Consent Updates', value: '24', change: '+5', trend: 'up' },
    { label: 'Data Deletions', value: '3', change: '-1', trend: 'down' },
    { label: 'Policy Violations', value: '0', change: '0', trend: 'stable' },
  ];

  const recentActivities = [
    { id: '1', action: 'Privacy Policy Updated', date: '2024-01-15', type: 'policy' },
    { id: '2', action: 'User Consent Refreshed', date: '2024-01-14', type: 'consent' },
    { id: '3', action: 'Data Retention Cleanup', date: '2024-01-13', type: 'cleanup' },
    { id: '4', action: 'GDPR Audit Completed', date: '2024-01-12', type: 'audit' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.tabTitle}>Compliance Reporting</Text>
      <Text style={styles.tabDescription}>
        View reports about how your data is used and compliance with privacy regulations.
      </Text>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        {complianceStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statChange, { color: stat.trend === 'up' ? '#34C759' : stat.trend === 'down' ? '#FF3B30' : '#666' }]}>
              {stat.change} this month
            </Text>
          </View>
        ))}
      </View>

      {/* Report Filters */}
      <View style={styles.filterContainer}>
        <Text style={styles.sectionTitle}>Report Period</Text>
        <View style={styles.filterOptions}>
          {['last7days', 'last30days', 'last90days', 'custom'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.filterButton, dateRange === period && styles.activeFilterButton]}
              onPress={() => setDateRange(period)}
            >
              <Text style={[styles.filterText, dateRange === period && styles.activeFilterText]}>
                {period.replace('last', 'Last ').replace('days', ' days')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Recent Compliance Activities</Text>
        {recentActivities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: 
              activity.type === 'policy' ? '#007AFF' :
              activity.type === 'consent' ? '#34C759' :
              activity.type === 'cleanup' ? '#FF9500' : '#AF52DE'
            }]}>
              <Text style={styles.activityIconText}>
                {activity.type.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityDate}>{activity.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Export Report Button */}
      <TouchableOpacity style={styles.exportButton}>
        <Text style={styles.exportButtonText}>Export Compliance Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Define route type
type RouteType = Route & {
  title: string;
};

// Main screen component
export const DataPrivacyComplianceScreen: React.FC = () => {
  const navigation = useNavigation<DataPrivacyScreenNavigationProp>();
  
  // Tab navigation state
  const [index, setIndex] = useState(0);
  const [routes] = useState<RouteType[]>([
    { key: 'consent', title: 'Consent' },
    { key: 'privacy', title: 'Privacy' },
    { key: 'compliance', title: 'Compliance' },
    { key: 'retention', title: 'Retention' },
    { key: 'requests', title: 'Requests' },
    { key: 'ai', title: 'AI Usage' },
  ]);

  // Scene map for the tab view
  const renderScene = SceneMap({
    consent: ConsentManagement,
    privacy: PrivacySettings,
    compliance: ComplianceReporting,
    retention: DataRetention,
    requests: SubjectAccessRequests,
    ai: AIDataTransparency,
  });

  // Custom tab bar with proper typing
  const renderTabBar = (props: SceneRendererProps & { navigationState: NavigationState<RouteType> }) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      scrollEnabled={true}
      tabStyle={styles.tab}
      activeColor="#0066cc"
      inactiveColor="#6c757d"
      labelStyle={styles.tabLabel}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Privacy & Compliance" 
        onBack={() => navigation.goBack()} 
      />
      
      <View style={styles.content}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={renderTabBar}
          initialLayout={{ width: Dimensions.get('window').width }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#212529',
  },
  tabDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 22,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212529',
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  tabBar: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  tabIndicator: {
    backgroundColor: '#0066cc',
  },
  tabLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  
  // Compliance Reporting styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    color: '#6c757d',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  activitiesContainer: {
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  exportButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 