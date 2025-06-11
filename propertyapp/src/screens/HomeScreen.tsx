import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { Card } from '@/components/ui/Card';
import { Permissions, Resource, Action } from '@/types/permissions';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const handleSetupWizard = () => {
    navigation.navigate('AIGuidedSetupWizard');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {/* AI Setup Wizard */}
        <View style={styles.aiWizardContainer}>
          <View style={styles.aiWizardContent}>
            <Text style={styles.aiWizardTitle}>Get Personalized AI Experience</Text>
            <Text style={styles.aiWizardDescription}>
              Use our AI-guided setup wizard to configure your preferences, notification settings, 
              and enable AI features that matter most to you.
            </Text>
            <Button 
              title="Start AI Setup Wizard" 
              variant="primary" 
              onPress={handleSetupWizard}
              style={styles.aiWizardButton}
            />
          </View>
        </View>

        {/* Features section visible to all */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureName}>Intelligent Unit Listing</Text>
            <Text style={styles.featureDescription}>
              AI-generated descriptions, smart pricing, and multi-platform publishing
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureName}>AI Communication Hub</Text>
            <Text style={styles.featureDescription}>
              Smart responses, sentiment analysis, and automated follow-ups
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureName}>Financial Management</Text>
            <Text style={styles.featureDescription}>
              Automated rent collection, expense categorization, and cash flow forecasting
            </Text>
          </View>
        </View>
        
        {/* Property Manager Section */}
        <PermissionGate permissions={[Permissions.PROPERTIES_VIEW, Permissions.PROPERTIES_EDIT]}>
          <Card style={styles.section}>
            <Card.Title title="Property Management" />
            <Card.Content>
              <Text>Manage your properties, units, and listings.</Text>
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('PropertyList')}
              >
                View Properties
              </Button>
              <PermissionGate resource={Resource.PROPERTIES} action={Action.CREATE}>
                <Button 
                  mode="outlined" 
                  onPress={() => navigation.navigate('AddProperty')}
                >
                  Add Property
                </Button>
              </PermissionGate>
            </Card.Actions>
          </Card>
        </PermissionGate>
        
        {/* Admin Section */}
        <PermissionGate minimumRole="admin">
          <Card style={styles.section}>
            <Card.Title title="Administration" />
            <Card.Content>
              <Text>Access administrative features and settings.</Text>
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('AdminDashboard')}
              >
                Admin Dashboard
              </Button>
              <PermissionGate permissions={[Permissions.USERS_VIEW, Permissions.USERS_EDIT]}>
                <Button 
                  mode="outlined" 
                  onPress={() => navigation.navigate('UserManagement')}
                >
                  Manage Users
                </Button>
              </PermissionGate>
            </Card.Actions>
          </Card>
        </PermissionGate>
        
        {/* Tenant Section */}
        <PermissionGate anyPermission={[
          Permissions.MAINTENANCE_CREATE,
          Permissions.PAYMENTS_VIEW,
          Permissions.DOCUMENTS_VIEW
        ]}>
          <Card style={styles.section}>
            <Card.Title title="Tenant Portal" />
            <Card.Content>
              <Text>Access your tenant resources and services.</Text>
            </Card.Content>
            <Card.Actions>
              <PermissionGate resource={Resource.MAINTENANCE} action={Action.CREATE}>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('MaintenanceRequest')}
                >
                  Maintenance Request
                </Button>
              </PermissionGate>
              <PermissionGate resource={Resource.PAYMENTS} action={Action.VIEW}>
                <Button 
                  mode="outlined" 
                  onPress={() => navigation.navigate('Payments')}
                >
                  View Payments
                </Button>
              </PermissionGate>
            </Card.Actions>
          </Card>
        </PermissionGate>

        {/* AI Features Section - Available to all users */}
        <Card style={styles.section}>
          <Card.Title title="AI Features" />
          <Card.Content>
            <Text>Access AI-powered features and tools.</Text>
          </Card.Content>
          <Card.Actions>
            <PermissionGate resource={Resource.AI_FEATURES} action={Action.VIEW}>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('AIGuidedSetupWizard')}
              >
                Setup Wizard
              </Button>
            </PermissionGate>
            <PermissionGate resource={Resource.AI_FEATURES} action={Action.GENERATE}>
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('AIRecommendations')}
              >
                Get Recommendations
              </Button>
            </PermissionGate>
          </Card.Actions>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            title="Log Out" 
            variant="outline" 
            onPress={logout}
            style={styles.button}
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  welcomeContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    lineHeight: 22,
  },
  featureItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  featureName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    marginBottom: 12,
  },
  aiWizardContainer: {
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    backgroundColor: '#f0f9ff',
  },
  aiWizardContent: {
    padding: 20,
  },
  aiWizardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 10,
  },
  aiWizardDescription: {
    fontSize: 16,
    color: '#075985',
    marginBottom: 15,
    lineHeight: 22,
  },
  aiWizardButton: {
    marginTop: 5,
  },
}); 