import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type ContractorDashboardScreenProps = NavigationProps<'WorkOrders'>;

interface WorkOrder {
  id: string;
  title: string;
  propertyAddress: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  estimatedDuration: number;
  description: string;
  tenantName: string;
  tenantPhone: string;
}

interface PerformanceMetric {
  label: string;
  value: string | number;
  change: number;
  icon: string;
}

const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    title: 'Fix Leaking Faucet',
    propertyAddress: '123 Main St, Unit 204',
    priority: 'medium',
    status: 'assigned',
    scheduledDate: '2024-01-20T10:00:00Z',
    estimatedDuration: 60,
    description: 'Kitchen faucet is leaking continuously',
    tenantName: 'John Smith',
    tenantPhone: '+1 (555) 123-4567',
  },
  {
    id: '2',
    title: 'HVAC Maintenance',
    propertyAddress: '456 Oak Ave, Unit 12B',
    priority: 'high',
    status: 'in_progress',
    scheduledDate: '2024-01-20T14:00:00Z',
    estimatedDuration: 120,
    description: 'Quarterly HVAC system check and filter replacement',
    tenantName: 'Sarah Johnson',
    tenantPhone: '+1 (555) 987-6543',
  },
  {
    id: '3',
    title: 'Replace Light Bulbs',
    propertyAddress: '789 Pine Rd, Unit 8C',
    priority: 'low',
    status: 'assigned',
    scheduledDate: '2024-01-21T09:00:00Z',
    estimatedDuration: 30,
    description: 'Replace burned out bulbs in living room and kitchen',
    tenantName: 'Mike Wilson',
    tenantPhone: '+1 (555) 456-7890',
  },
];

const mockMetrics: PerformanceMetric[] = [
  {
    label: 'Jobs Completed',
    value: 24,
    change: 12,
    icon: '✅',
  },
  {
    label: 'Average Rating',
    value: '4.8',
    change: 0.2,
    icon: '⭐',
  },
  {
    label: 'Response Time',
    value: '2.3h',
    change: -0.5,
    icon: '⏱️',
  },
  {
    label: 'Monthly Earnings',
    value: '$3,450',
    change: 8.5,
    icon: '💰',
  },
];

export function ContractorDashboardScreen({ navigation }: ContractorDashboardScreenProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [metrics] = useState<PerformanceMetric[]>(mockMetrics);
  const [todayOrders, setTodayOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    // Filter today's work orders
    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = workOrders.filter(order =>
      order.scheduledDate.startsWith(today)
    );
    setTodayOrders(todaysOrders);
  }, [workOrders]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#007bff';
      case 'in_progress': return '#ffc107';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const handleWorkOrderPress = (workOrder: WorkOrder) => {
    Alert.alert('Work Order Details', `Viewing details for: ${workOrder.title}`);
  };

  const handleStartJob = (workOrderId: string) => {
    setWorkOrders(prev =>
      prev.map(order =>
        order.id === workOrderId
          ? { ...order, status: 'in_progress' }
          : order
      )
    );
    Alert.alert('Job Started', 'You have started working on this job.');
  };

  const handleCompleteJob = (workOrderId: string) => {
    Alert.alert(
      'Complete Job',
      'Mark this job as completed?',
      [
        {
          text: 'Complete',
          onPress: () => {
            setWorkOrders(prev =>
              prev.map(order =>
                order.id === workOrderId
                  ? { ...order, status: 'completed' }
                  : order
              )
            );
            Alert.alert('Job Completed', 'Job has been marked as completed.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMetricCard = (metric: PerformanceMetric) => (
    <View key={metric.label} style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{metric.icon}</Text>
        <View style={[
          styles.metricChange,
          { backgroundColor: metric.change >= 0 ? '#d4edda' : '#f8d7da' }
        ]}>
          <Text style={[
            styles.metricChangeText,
            { color: metric.change >= 0 ? '#155724' : '#721c24' }
          ]}>
            {metric.change >= 0 ? '+' : ''}{metric.change}{typeof metric.change === 'number' && metric.change % 1 !== 0 ? '' : '%'}
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={styles.metricLabel}>{metric.label}</Text>
    </View>
  );

  const renderWorkOrderCard = ({ item }: { item: WorkOrder }) => (
    <TouchableOpacity
      style={styles.workOrderCard}
      onPress={() => handleWorkOrderPress(item)}
    >
      <View style={styles.workOrderHeader}>
        <View style={styles.workOrderInfo}>
          <Text style={styles.workOrderTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.workOrderAddress} numberOfLines={1}>
            {item.propertyAddress}
          </Text>
        </View>
        <View style={styles.workOrderBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.workOrderDetails}>
        <Text style={styles.workOrderTime}>
          {formatTime(item.scheduledDate)} • {item.estimatedDuration} min
        </Text>
        <Text style={styles.workOrderTenant}>
          {item.tenantName} • {item.tenantPhone}
        </Text>
      </View>

      <Text style={styles.workOrderDescription} numberOfLines={2}>
        {item.description}
      </Text>

      {item.status === 'assigned' && (
        <TouchableOpacity
          style={styles.startJobButton}
          onPress={() => handleStartJob(item.id)}
        >
          <Text style={styles.startJobButtonText}>Start Job</Text>
        </TouchableOpacity>
      )}

      {item.status === 'in_progress' && (
        <TouchableOpacity
          style={styles.completeJobButton}
          onPress={() => handleCompleteJob(item.id)}
        >
          <Text style={styles.completeJobButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning, Alex!</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          <View style={styles.metricsGrid}>
            {metrics.map(renderMetricCard)}
          </View>
        </View>

        <View style={styles.todaySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Jobs ({todayOrders.length})</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => Alert.alert('Work Orders', 'All work orders screen coming soon!')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {todayOrders.length > 0 ? (
            <FlatList
              data={todayOrders}
              renderItem={renderWorkOrderCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No jobs scheduled for today</Text>
              <Text style={styles.emptyText}>Check back later for new assignments</Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Work Orders', 'All work orders screen coming soon!')}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>All Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Profile', 'Profile screen coming soon!')}
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Schedule', 'Schedule management coming soon!')}
          >
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Messages', 'Messages coming soon!')}
          >
            <Text style={styles.quickActionIcon}>💬</Text>
            <Text style={styles.quickActionText}>Messages</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6c757d',
  },
  metricsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    fontSize: 24,
  },
  metricChange: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  metricChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todaySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  workOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workOrderInfo: {
    flex: 1,
    marginRight: 12,
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  workOrderAddress: {
    fontSize: 14,
    color: '#6c757d',
  },
  workOrderBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  workOrderDetails: {
    marginBottom: 8,
  },
  workOrderTime: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 4,
  },
  workOrderTenant: {
    fontSize: 12,
    color: '#6c757d',
  },
  workOrderDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 12,
  },
  startJobButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  startJobButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completeJobButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  completeJobButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#212529',
    fontWeight: '500',
  },
});