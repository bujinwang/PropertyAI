import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type PropertyManagerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PropertyStat {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: 'up' | 'down';
}

interface QuickAction {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  count?: number;
}

interface Task {
  id: string;
  type: 'maintenance' | 'rent' | 'lease' | 'inspection';
  title: string;
  property: string;
  unit?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  occupancy: number;
  monthlyRevenue: number;
  status: 'active' | 'maintenance' | 'vacant';
}

export const PropertyManagerDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<PropertyManagerDashboardNavigationProp>();

  const propertyStats: PropertyStat[] = [
    {
      title: 'Total Properties',
      value: 8,
      icon: 'business-outline',
      color: '#007AFF',
    },
    {
      title: 'Units Managed',
      value: 124,
      icon: 'home-outline',
      color: '#34C759',
    },
    {
      title: 'Occupancy Rate',
      value: '92%',
      icon: 'people-outline',
      color: '#FF9500',
      trend: 'up',
    },
    {
      title: 'Monthly Revenue',
      value: '$47,850',
      icon: 'cash-outline',
      color: '#5856D6',
      trend: 'up',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Add Property',
      icon: 'add-circle-outline',
      color: '#007AFF',
      onPress: () => navigation.navigate('AddProperty' as any),
    },
    {
      title: 'Create Listing',
      icon: 'create-outline',
      color: '#34C759',
      onPress: () => navigation.navigate('CreateListing' as any),
    },
    {
      title: 'View Tasks',
      icon: 'checkmark-done-circle-outline',
      color: '#FF9500',
      onPress: () => navigation.navigate('Tasks' as any),
      count: 7,
    },
    {
      title: 'Maintenance',
      icon: 'construct-outline',
      color: '#FF3B30',
      onPress: () => navigation.navigate('Maintenance' as any),
      count: 3,
    },
    {
      title: 'Messages',
      icon: 'chatbubble-ellipses-outline',
      color: '#AF52DE',
      onPress: () => navigation.navigate('Messages' as any),
      count: 12,
    },
    {
      title: 'Reports',
      icon: 'document-text-outline',
      color: '#FF2D92',
      onPress: () => navigation.navigate('Reports' as any),
    },
  ];

  const tasks: Task[] = [
    {
      id: '1',
      type: 'maintenance',
      title: 'HVAC repair needed',
      property: 'Sunset Apartments',
      unit: 'Unit 205',
      priority: 'high',
      dueDate: 'Today',
    },
    {
      id: '2',
      type: 'rent',
      title: 'Follow up on late payment',
      property: 'Oakwood Heights',
      unit: 'Unit 12A',
      priority: 'medium',
      dueDate: 'Tomorrow',
    },
    {
      id: '3',
      type: 'lease',
      title: 'Renew lease agreement',
      property: 'Riverside Plaza',
      unit: 'Unit 301',
      priority: 'medium',
      dueDate: 'In 3 days',
    },
    {
      id: '4',
      type: 'inspection',
      title: 'Move-in inspection',
      property: 'Downtown Lofts',
      unit: 'Unit 8B',
      priority: 'low',
      dueDate: 'Next week',
    },
  ];

  const properties: Property[] = [
    {
      id: '1',
      name: 'Sunset Apartments',
      address: '123 Main St, Downtown',
      units: 24,
      occupancy: 22,
      monthlyRevenue: 15600,
      status: 'active',
    },
    {
      id: '2',
      name: 'Oakwood Heights',
      address: '456 Oak Ave, Suburbs',
      units: 18,
      occupancy: 17,
      monthlyRevenue: 12750,
      status: 'active',
    },
    {
      id: '3',
      name: 'Riverside Plaza',
      address: '789 River Rd, Riverside',
      units: 32,
      occupancy: 29,
      monthlyRevenue: 19800,
      status: 'maintenance',
    },
    {
      id: '4',
      name: 'Downtown Lofts',
      address: '321 Central Blvd, Downtown',
      units: 15,
      occupancy: 15,
      monthlyRevenue: 9750,
      status: 'active',
    },
  ];

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'maintenance':
        return 'construct-outline';
      case 'rent':
        return 'cash-outline';
      case 'lease':
        return 'document-text-outline';
      case 'inspection':
        return 'eye-outline';
      default:
        return 'clipboard-outline';
    }
  };

  const getTaskColor = (type: Task['type']) => {
    switch (type) {
      case 'maintenance':
        return '#FF3B30';
      case 'rent':
        return '#FF9500';
      case 'lease':
        return '#007AFF';
      case 'inspection':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
    }
  };

  const renderStatCard = (stat: PropertyStat) => (
    <Card key={stat.title} style={[styles.statCard, { borderLeftColor: stat.color }]}>
      <Card.Content>
        <View style={styles.statHeader}>
          <Ionicons name={stat.icon as any} size={24} color={stat.color} />
          {stat.trend && (
            <Ionicons
              name={stat.trend === 'up' ? 'trending-up' : 'trending-down'}
              size={16}
              color={stat.trend === 'up' ? '#34C759' : '#FF3B30'}
            />
          )}
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
        {action.count && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionCount}>{action.count}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.actionTitle, { color: action.color }]}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity style={styles.taskItem}>
      <View style={styles.taskContent}>
        <View style={[styles.taskIcon, { backgroundColor: `${getTaskColor(item.type)}15` }]}>
          <Ionicons name={getTaskIcon(item.type) as any} size={20} color={getTaskColor(item.type)} />
        </View>
        <View style={styles.taskDetails}>
          <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.taskProperty}>
            {item.property} {item.unit && `• ${item.unit}`}
          </Text>
        </View>
        <View style={styles.taskMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
          <Text style={styles.taskDue}>{item.dueDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity style={styles.propertyItem}>
      <View style={styles.propertyContent}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyName} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.status === 'active' ? '#34C759' : 
                           item.status === 'maintenance' ? '#FF9500' : '#8E8E93'
          }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.propertyAddress} numberOfLines={1}>{item.address}</Text>
        <View style={styles.propertyStats}>
          <Text style={styles.propertyStat}>
            {item.units} units • {item.occupancy} occupied
          </Text>
          <Text style={styles.propertyRevenue}>${item.monthlyRevenue.toLocaleString()}/mo</Text>
        </View>
        <View style={styles.occupancyBar}>
          <View 
            style={[styles.occupancyFill, { 
              width: `${(item.occupancy / item.units) * 100}%`,
              backgroundColor: '#34C759'
            }]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.firstName || 'Manager'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>5</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          {propertyStats.map(renderStatCard)}
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

        {/* Recent Tasks */}
        <Card style={styles.section}>
          <Card.Title title="Upcoming Tasks" />
          <Card.Content>
            <FlatList
              data={tasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </Card.Content>
        </Card>

        {/* Recent Properties */}
        <Card style={styles.section}>
          <Card.Title title="My Properties" />
          <Card.Content>
            <FlatList
              data={properties}
              renderItem={renderPropertyItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
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
    marginBottom: 8,
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
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskProperty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskDue: {
    fontSize: 12,
    color: '#666',
  },
  propertyItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  propertyContent: {
    padding: 12,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyStat: {
    fontSize: 14,
    color: '#666',
  },
  propertyRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  occupancyBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default PropertyManagerDashboardScreen;