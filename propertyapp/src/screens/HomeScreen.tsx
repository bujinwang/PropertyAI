import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { Button } from '@components/ui/Button';
import { useAuth } from '@/contexts';
import { PermissionGate } from '@/components/auth/PermissionGate';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>PropertyAI</Text>
          <Text style={styles.subtitle}>AI-Powered Property Management</Text>
          
          {user && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
              <Text style={styles.roleText}>Role: {user.role}</Text>
            </View>
          )}
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
        
        {/* Content visible only to property managers and admins */}
        <PermissionGate allowedRoles={['propertyManager', 'admin']}>
          <View style={styles.managerSection}>
            <Text style={styles.sectionTitle}>Property Management</Text>
            <Text style={styles.sectionDescription}>
              As a property manager, you have access to property listing, tenant management, 
              and maintenance request features.
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Properties</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>48</Text>
                <Text style={styles.statLabel}>Units</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Requests</Text>
              </View>
            </View>
            
            <Button 
              title="Manage Properties" 
              variant="secondary" 
              style={styles.button}
            />
          </View>
        </PermissionGate>
        
        {/* Content visible only to admins */}
        <PermissionGate allowedRoles={['admin']}>
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Administrator Dashboard</Text>
            <Text style={styles.sectionDescription}>
              As an administrator, you have full access to all system features, 
              including user management and system configuration.
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4</Text>
                <Text style={styles.statLabel}>Managers</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>95%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
            </View>
            
            <Button 
              title="System Settings" 
              variant="primary" 
              style={styles.button}
            />
          </View>
        </PermissionGate>
        
        {/* Content visible only to tenants */}
        <PermissionGate allowedRoles={['tenant']}>
          <View style={styles.tenantSection}>
            <Text style={styles.sectionTitle}>Tenant Portal</Text>
            <Text style={styles.sectionDescription}>
              Welcome to your tenant portal! Here you can pay rent, submit maintenance 
              requests, and communicate with your property manager.
            </Text>
            
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>Rent Due</Text>
              <Text style={styles.alertText}>
                Your rent payment of $1,200 is due in 5 days.
              </Text>
            </View>
            
            <Button 
              title="Pay Rent" 
              variant="primary" 
              style={styles.button}
            />
            
            <Button 
              title="Submit Maintenance Request" 
              variant="secondary" 
              style={styles.button}
            />
          </View>
        </PermissionGate>

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
  managerSection: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  adminSection: {
    backgroundColor: '#fff0f0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  tenantSection: {
    backgroundColor: '#f0fff0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alertBox: {
    backgroundColor: '#ffe8e8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c53030',
    marginBottom: 5,
  },
  alertText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    marginBottom: 12,
  },
}); 