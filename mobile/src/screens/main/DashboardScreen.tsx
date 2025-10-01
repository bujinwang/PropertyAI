import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, useTheme, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import type { MainTabParamList } from '@/types';

export function DashboardScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Welcome back, {user?.firstName}!
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onBackground }]}>
            Here's your property overview
          </Text>
        </View>

        <View style={styles.metrics}>
          <Card style={styles.metricCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                12
              </Text>
              <Text variant="bodyMedium">Total Properties</Text>
            </Card.Content>
          </Card>

          <Card style={styles.metricCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                8
              </Text>
              <Text variant="bodyMedium">Occupied Units</Text>
            </Card.Content>
          </Card>

          <Card style={styles.metricCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                3
              </Text>
              <Text variant="bodyMedium">Maintenance Requests</Text>
            </Card.Content>
          </Card>

          <Card style={styles.metricCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                $24,500
              </Text>
              <Text variant="bodyMedium">Monthly Revenue</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.quickActions}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              style={styles.actionButton}
              onPress={() => {
                // Navigate to Properties tab - property managers can add properties there
                navigation.navigate('Properties');
              }}
            >
              Add Property
            </Button>

            <Button
              mode="outlined"
              style={styles.actionButton}
              onPress={() => {
                // Navigate to Maintenance tab to view all maintenance requests
                navigation.navigate('Maintenance');
              }}
            >
              View Maintenance
            </Button>

            <Button
              mode="outlined"
              style={styles.actionButton}
              onPress={() => {
                // Navigate to Payments tab to process payments
                navigation.navigate('Payments');
              }}
            >
              Process Payments
            </Button>
          </View>
        </View>

        <View style={styles.recentActivity}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Recent Activity
          </Text>

          <Card style={styles.activityCard}>
            <Card.Content>
              <Text variant="bodyMedium">New maintenance request for Unit 3B</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                2 hours ago
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.activityCard}>
            <Card.Content>
              <Text variant="bodyMedium">Rent payment received from Tenant John Doe</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                1 day ago
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Button
          mode="outlined"
          onPress={logout}
          style={styles.logoutButton}
        >
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    margin: 4,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    margin: 4,
    minWidth: '45%',
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityCard: {
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});