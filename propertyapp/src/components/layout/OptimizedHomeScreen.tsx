import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Permissions, Resource, Action } from '@/types/permissions';
import { 
  LAYOUT, 
  CONTENT_WIDTH, 
  CARD_LAYOUTS,
  SCREEN_LAYOUT,
  SAFE_AREA 
} from '@/styles/mobileLayout';

interface HomeSection {
  id: string;
  title: string;
  type: 'ai-features' | 'property-management' | 'tenant-portal' | 'admin-section';
  data: any[];
}

export const OptimizedHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Add data refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const sections: HomeSection[] = [
    {
      id: 'ai-wizard',
      title: 'AI Features',
      type: 'ai-features',
      data: [
        {
          title: 'AI Setup Wizard',
          description: 'Get personalized recommendations',
          action: () => navigation.navigate('AIGuidedSetupWizard'),
          icon: '🤖',
        },
      ],
    },
    {
      id: 'property-management',
      title: 'Property Management',
      type: 'property-management',
      data: [
        { title: 'View Properties', action: () => navigation.navigate('PropertyList') },
        { title: 'Add Property', action: () => navigation.navigate('PropertyCreate') },
      ],
    },
    {
      id: 'tenant-portal',
      title: 'Tenant Portal',
      type: 'tenant-portal',
      data: [
        { title: 'Maintenance Request', action: () => navigation.navigate('MaintenanceCreate') },
        { title: 'View Payments', action: () => navigation.navigate('Payments') },
      ],
    },
  ];

  const renderSectionHeader = ({ section }: { section: HomeSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderQuickAction = ({ item }: { item: any }) => (
    <Card style={styles.quickActionCard}>
      <Card.Content>
        <Text style={styles.quickActionTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.quickActionDescription}>{item.description}</Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button 
          title="Go" 
          variant="primary" 
          onPress={item.action}
          style={styles.quickActionButton}
        />
      </Card.Actions>
    </Card>
  );

  const renderHorizontalSection = ({ section }: { section: HomeSection }) => {
    switch (section.type) {
      case 'ai-features':
        return (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <FlatList
              horizontal
              data={section.data}
              renderItem={renderQuickAction}
              keyExtractor={(item) => item.title}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
            />
          </View>
        );
      
      case 'property-management':
        return (
          <PermissionGate permissions={[Permissions.PROPERTIES_VIEW, Permissions.PROPERTIES_EDIT]}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.data.map((item, index) => (
                <Card key={index} style={styles.compactCard}>
                  <Card.Content>
                    <Text style={styles.compactCardTitle}>{item.title}</Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button title="Go" variant="outline" onPress={item.action} />
                  </Card.Actions>
                </Card>
              ))}
            </View>
          </PermissionGate>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PropertyAI</Text>
          <Text style={styles.subtitle}>AI-Powered Property Management</Text>
          
          {user && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome, {user.firstName || 'User'}</Text>
              <Text style={styles.roleText}>Role: {user.role}</Text>
            </View>
          )}
        </View>

        {/* AI Features Section - Horizontal Scroll */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            <Card style={styles.aiCard}>
              <Card.Content>
                <Text style={styles.aiCardTitle}>AI Setup Wizard</Text>
                <Text style={styles.aiCardDescription}>
                  Configure AI features for your specific needs
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button 
                  title="Start Setup" 
                  variant="primary" 
                  onPress={() => navigation.navigate('AIGuidedSetupWizard')}
                />
              </Card.Actions>
            </Card>
          </ScrollView>
        </View>

        {/* Role-based Sections */}
        <PermissionGate permissions={[Permissions.PROPERTIES_VIEW]}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Property Management</Text>
            <View style={styles.actionGrid}>
              <Card style={styles.actionCard}>
                <Card.Content>
                  <Text style={styles.actionTitle}>View Properties</Text>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    title="Browse" 
                    variant="outline" 
                    onPress={() => navigation.navigate('PropertyList')}
                  />
                </Card.Actions>
              </Card>
              
              <PermissionGate resource={Resource.PROPERTIES} action={Action.CREATE}>
                <Card style={styles.actionCard}>
                  <Card.Content>
                    <Text style={styles.actionTitle}>Add Property</Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button 
                      title="Create" 
                      variant="primary" 
                      onPress={() => navigation.navigate('PropertyCreate')}
                    />
                  </Card.Actions>
                </Card>
              </PermissionGate>
            </View>
          </View>
        </PermissionGate>

        {/* Quick Actions FAB */}
        <View style={styles.fabContainer}>
          <Button 
            title="+" 
            variant="primary" 
            style={styles.fab}
            onPress={() => {/* TODO: Add quick action menu */}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: SAFE_AREA.bottom + LAYOUT.spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: LAYOUT.spacing.xl,
    paddingHorizontal: LAYOUT.spacing.md,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: LAYOUT.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  welcomeContainer: {
    marginTop: LAYOUT.spacing.md,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    marginTop: LAYOUT.spacing.xs,
  },
  sectionContainer: {
    marginBottom: LAYOUT.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: LAYOUT.spacing.md,
    paddingHorizontal: LAYOUT.spacing.md,
  },
  horizontalScroll: {
    paddingHorizontal: LAYOUT.spacing.md,
  },
  aiSection: {
    marginBottom: LAYOUT.spacing.xl,
  },
  aiCard: {
    width: CONTENT_WIDTH.maxWidth,
    marginRight: LAYOUT.spacing.md,
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: LAYOUT.spacing.xs,
  },
  aiCardDescription: {
    fontSize: 14,
    color: '#075985',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LAYOUT.spacing.md,
    paddingHorizontal: LAYOUT.spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: (CONTENT_WIDTH.withMargins - LAYOUT.spacing.md) / 2,
    maxWidth: (CONTENT_WIDTH.withMargins - LAYOUT.spacing.md) / 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  compactCard: {
    marginHorizontal: LAYOUT.spacing.md,
    marginBottom: LAYOUT.spacing.sm,
  },
  compactCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fabContainer: {
    position: 'absolute',
    bottom: SAFE_AREA.bottom + LAYOUT.spacing.md,
    right: LAYOUT.spacing.md,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
  },
});