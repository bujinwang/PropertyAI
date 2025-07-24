import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type AdminDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'neutral';
}

interface QuickAction {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'property' | 'payment' | 'maintenance';
  message: string;
  time: string;
  user: string;
}

export const AdminDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<AdminDashboardNavigationProp>();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: '1,247',
      change: '+12%',
      icon: 'people-outline',
      color: '#007AFF',
      trend: 'up',
    },
    {
      title: 'Active Properties',
      value: '342',
      change: '+8%',
      icon: 'business-outline',
      color: '#34C759',
      trend: 'up',
    },
    {
      title: 'Monthly Revenue',
      value: '$84,230',
      change: '+15%',
      icon: 'cash-outline',
      color: '#FF9500',
      trend: 'up',
    },
    {
      title: 'Pending Issues',
      value: '23',
      change: '-5%',
      icon: 'alert-circle-outline',
      color: '#FF3B30',
      trend: 'down',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Manage Users',
      icon: 'people-outline',
      color: '#007AFF',
      onPress: () => navigation.navigate('UserManagement' as any),
    },
    {
      title: 'System Settings',
      icon: 'settings-outline',
      color: '#5856D6',
      onPress: () => navigation.navigate('SystemSettings' as any),
    },
    {
      title: 'Analytics',
      icon: 'analytics-outline',
      color: '#FF9500',
      onPress: () => navigation.navigate('Analytics' as any),
    },
    {
      title: 'Data Export',
      icon: 'download-outline',
      color: '#34C759',
      onPress: () => navigation.navigate('DataExport' as any),
    },
    {
      title: 'AI Training',
      icon: 'bulb-outline',
      color: '#AF52DE',
      onPress: () => navigation.navigate('AITraining' as any),
    },
    {
      title: 'API Keys',
      icon: 'key-outline',
      color: '#FF2D92',
      onPress: () => navigation.navigate('APIKeys' as any),
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'user',
      message: 'New user registered: John Smith',
      time: '2 min ago',
      user: 'System',
    },
    {
      id: '2',
      type: 'property',
      message: 'Property "Sunset Apartments" was added',
      time: '15 min ago',
      user: 'Admin',
    },
    {
      id: '3',
      type: 'payment',
      message: 'Payment processed: $2,400 from Oakwood Heights',
      time: '1 hour ago',
      user: 'System',
    },
    {
      id: '4',
      type: 'maintenance',
      message: 'Maintenance request resolved: Unit 205',
      time: '2 hours ago',
      user: 'Property Manager',
    },
    {
      id: '5',
      type: 'user',
      message: 'User role updated: Sarah Johnson → Property Manager',
      time: '3 hours ago',
      user: 'Admin',
    },
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user':
        return 'person-add-outline';
      case 'property':
        return 'home-outline';
      case 'payment':
        return 'card-outline';
      case 'maintenance':
        return 'construct-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user':
        return '#007AFF';
      case 'property':
        return '#34C759';
      case 'payment':
        return '#FF9500';
      case 'maintenance':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const renderStatCard = (stat: StatCard) => (
    <Card key={stat.title} style={[styles.statCard, { borderLeftColor: stat.color }]}>
      <Card.Content>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
          </View>
          <View style={styles.statChange}>
            <Ionicons
              name={stat.trend === 'up' ? 'trending-up' : 'trending-down'}
              size={16}
              color={stat.trend === 'up' ? '#34C759' : '#FF3B30'}
            />
            <Text style={[styles.changeText, { color: stat.trend === 'up' ? '#34C759' : '#FF3B30' }]}>
              {stat.change}
            </Text>
          </View>
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
      </Card.Content>
    </Card>
  );

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.title}
      style={[styles.quickAction, { backgroundColor: `${action.color}15` }]}
      onPress={action.onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
        <Ionicons name={action.icon as any} size={24} color="#fff" />
      </View>
      <Text style={[styles.actionTitle, { color: action.color }]}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderActivityItem = (activity: RecentActivity) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: `${getActivityColor(activity.type)}15` }]}>
        <Ionicons
          name={getActivityIcon(activity.type) as any}
          size={20}
          color={getActivityColor(activity.type)}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityMessage}>{activity.message}</Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityUser}>{activity.user}</Text>
          <Text style={styles.activityTime}>{activity.time}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName || 'Admin'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['7d', '30d', '90d'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.activePeriod]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.activePeriodText]}>
                {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {stats.map(renderStatCard)}
        </View>

        {/* Quick Actions */}
        <Card style={styles.section}>
          <Card.Title title="Quick Actions" />
          <Card.Content>
            <View style={styles.quickActionsGrid}>
              {quickActions.map(renderQuickAction)}
            </View>
          </Card.Content>
        </Card>

        {/* System Status */}
        <Card style={styles.section}>
          <Card.Title title="System Status" />
          <Card.Content>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                  <Text style={styles.statusText}>API</Text>
                </View>
                <Text style={styles.statusValue}>Operational</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                  <Text style={styles.statusText}>Database</Text>
                </View>
                <Text style={styles.statusValue}>Operational</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
                  <Text style={styles.statusText}>AI Services</Text>
                </View>
                <Text style={styles.statusValue}>Degraded</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.section}>
          <Card.Title title="Recent Activity" />
          <Card.Content>
            {recentActivities.map(renderActivityItem)}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  activePeriod: {
    backgroundColor: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  activePeriodText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  statCard: {
    width: (Dimensions.get('window').width - 40) / 2 - 5,
    margin: 5,
    borderLeftWidth: 3,
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (Dimensions.get('window').width - 60) / 3,
    aspectRatio: 1,
    marginVertical: 5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityUser: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default AdminDashboardScreen;