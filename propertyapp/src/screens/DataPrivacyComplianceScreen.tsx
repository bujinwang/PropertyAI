import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Dimensions } from 'react-native';
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

// Placeholder component for Compliance Reporting tab
const ComplianceReporting = () => (
  <ScrollView contentContainerStyle={styles.tabContent}>
    <Text style={styles.tabTitle}>Compliance Reporting</Text>
    <Text style={styles.tabDescription}>
      View reports about how your data is used and compliance with privacy regulations.
    </Text>
    <View style={styles.comingSoonContainer}>
      <Text style={styles.comingSoonText}>Coming Soon</Text>
      <Text style={styles.comingSoonDescription}>
        Detailed compliance reporting features are under development.
      </Text>
    </View>
  </ScrollView>
);

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
}); 