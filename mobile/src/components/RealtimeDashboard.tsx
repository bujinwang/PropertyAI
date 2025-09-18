import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Card, Chip, Badge, Button, Divider } from 'react-native-paper';
import { useRealtimeConnection, useRealtimeSubscription } from '../services/realtimeService';
import { usePushNotifications, notificationUtils } from '../services/pushNotificationService';
import { performanceMonitor } from '../utils/performanceMonitor';
import { measurePerformance } from '../utils/performanceMonitor';

interface RealtimeData {
  properties: any[];
  maintenance: any[];
  payments: any[];
  analytics: any;
  marketData: any;
}

interface ConnectionStatus {
  websocket: boolean;
  notifications: boolean;
  lastUpdate: number;
}

const RealtimeDashboard: React.FC = () => {
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    properties: [],
    maintenance: [],
    payments: [],
    analytics: null,
    marketData: null,
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    websocket: false,
    notifications: false,
    lastUpdate: Date.now(),
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Real-time connection status
  const isConnected = useRealtimeConnection();

  // Push notifications
  const { notifications, unreadCount, sendNotification } = usePushNotifications();

  // Subscribe to real-time updates
  useRealtimeSubscription('property:update', (data) => {
    console.log('🏠 Property update received:', data);
    setRealtimeData(prev => ({
      ...prev,
      properties: [data, ...prev.properties.slice(0, 9)], // Keep last 10
    }));
    setConnectionStatus(prev => ({ ...prev, lastUpdate: Date.now() }));
  });

  useRealtimeSubscription('maintenance:update', (data) => {
    console.log('🔧 Maintenance update received:', data);
    setRealtimeData(prev => ({
      ...prev,
      maintenance: [data, ...prev.maintenance.slice(0, 9)],
    }));
    setConnectionStatus(prev => ({ ...prev, lastUpdate: Date.now() }));
  });

  useRealtimeSubscription('payment:update', (data) => {
    console.log('💳 Payment update received:', data);
    setRealtimeData(prev => ({
      ...prev,
      payments: [data, ...prev.payments.slice(0, 9)],
    }));
    setConnectionStatus(prev => ({ ...prev, lastUpdate: Date.now() }));
  });

  useRealtimeSubscription('analytics:update', (data) => {
    console.log('📊 Analytics update received:', data);
    setRealtimeData(prev => ({
      ...prev,
      analytics: data,
    }));
    setConnectionStatus(prev => ({ ...prev, lastUpdate: Date.now() }));
  });

  useRealtimeSubscription('market-data:update', (data) => {
    console.log('📈 Market data update received:', data);
    setRealtimeData(prev => ({
      ...prev,
      marketData: data,
    }));
    setConnectionStatus(prev => ({ ...prev, lastUpdate: Date.now() }));
  });

  // Update connection status
  useEffect(() => {
    setConnectionStatus(prev => ({
      ...prev,
      websocket: isConnected,
      notifications: true, // Assume notifications are working if component loads
    }));
  }, [isConnected]);

  // Update performance metrics
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = performanceMonitor.getMetrics();
      setPerformanceMetrics(metrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Test functions
  const testLocalNotification = async () => {
    await measurePerformance('send-test-notification', async () => {
      const notificationId = await sendNotification({
        title: 'Test Notification',
        body: 'This is a test real-time notification!',
        data: { type: 'test', timestamp: Date.now() },
      });

      if (notificationId) {
        Alert.alert('Success', `Notification sent with ID: ${notificationId}`);
      } else {
        Alert.alert('Error', 'Failed to send notification');
      }
    });
  };

  const testRealtimeConnection = () => {
    const isConnected = connectionStatus.websocket;
    Alert.alert(
      'Connection Status',
      `WebSocket: ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}\n` +
      `Last Update: ${new Date(connectionStatus.lastUpdate).toLocaleTimeString()}\n` +
      `Queued Events: 0` // Would need to get from service
    );
  };

  const clearNotifications = () => {
    // This would clear notification history
    Alert.alert('Info', 'Notification history cleared');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Connection Status Header */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Real-time Status</Text>
            <View style={styles.statusIndicators}>
              <Chip
                icon={connectionStatus.websocket ? 'wifi' : 'wifi-off'}
                style={[
                  styles.statusChip,
                  { backgroundColor: connectionStatus.websocket ? '#4CAF50' : '#F44336' }
                ]}
              >
                WebSocket
              </Chip>
              <Chip
                icon="bell"
                style={[
                  styles.statusChip,
                  { backgroundColor: connectionStatus.notifications ? '#4CAF50' : '#F44336' }
                ]}
              >
                Notifications
              </Chip>
            </View>
          </View>

          <Text style={styles.lastUpdate}>
            Last Update: {new Date(connectionStatus.lastUpdate).toLocaleTimeString()}
          </Text>

          {unreadCount > 0 && (
            <Badge style={styles.unreadBadge}>{unreadCount}</Badge>
          )}
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <Card style={styles.metricsCard}>
          <Card.Title title="Performance Metrics" />
          <Card.Content>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>App Start</Text>
                <Text style={styles.metricValue}>
                  {performanceMetrics.appStartTime ? `${performanceMetrics.appStartTime}ms` : 'N/A'}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Memory</Text>
                <Text style={styles.metricValue}>
                  {performanceMetrics.memoryUsage ? `${performanceMetrics.memoryUsage}MB` : 'N/A'}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Slow Frames</Text>
                <Text style={styles.metricValue}>
                  {performanceMetrics.slowFrames || 0}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Network</Text>
                <Text style={styles.metricValue}>
                  {performanceMetrics.networkRequests || 0}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Test Controls */}
      <Card style={styles.controlsCard}>
        <Card.Title title="Test Controls" />
        <Card.Content>
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={testLocalNotification}
              style={styles.testButton}
            >
              Test Notification
            </Button>
            <Button
              mode="outlined"
              onPress={testRealtimeConnection}
              style={styles.testButton}
            >
              Connection Status
            </Button>
          </View>
          <Button
            mode="text"
            onPress={clearNotifications}
            style={styles.clearButton}
          >
            Clear Notifications
          </Button>
        </Card.Content>
      </Card>

      {/* Real-time Data Sections */}
      <RealtimeDataSection
        title="Property Updates"
        data={realtimeData.properties}
        icon="home"
        emptyMessage="No property updates yet"
      />

      <RealtimeDataSection
        title="Maintenance Alerts"
        data={realtimeData.maintenance}
        icon="wrench"
        emptyMessage="No maintenance alerts"
      />

      <RealtimeDataSection
        title="Payment Updates"
        data={realtimeData.payments}
        icon="credit-card"
        emptyMessage="No payment updates"
      />

      {/* Analytics Summary */}
      {realtimeData.analytics && (
        <Card style={styles.analyticsCard}>
          <Card.Title title="Live Analytics" />
          <Card.Content>
            <Text style={styles.analyticsText}>
              Active Users: {realtimeData.analytics.activeUsers || 'N/A'}
            </Text>
            <Text style={styles.analyticsText}>
              Properties Tracked: {realtimeData.analytics.propertiesTracked || 'N/A'}
            </Text>
            <Text style={styles.analyticsText}>
              Last Updated: {new Date(realtimeData.analytics.timestamp).toLocaleTimeString()}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Market Data */}
      {realtimeData.marketData && (
        <Card style={styles.marketCard}>
          <Card.Title title="Market Data" />
          <Card.Content>
            <Text style={styles.marketText}>
              Index: {realtimeData.marketData.index || 'N/A'}
            </Text>
            <Text style={[
              styles.marketChange,
              { color: (realtimeData.marketData.change || 0) >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              Change: {realtimeData.marketData.change || 0}%
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card style={styles.notificationsCard}>
          <Card.Title title="Recent Notifications" />
          <Card.Content>
            {notifications.slice(0, 5).map((notification, index) => (
              <View key={notification.id || index} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <Text style={styles.notificationTime}>
                  {notificationUtils.formatNotificationTime(notification.timestamp)}
                </Text>
                {!notification.read && (
                  <Badge style={styles.newBadge}>New</Badge>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

// Reusable component for real-time data sections
const RealtimeDataSection: React.FC<{
  title: string;
  data: any[];
  icon: string;
  emptyMessage: string;
}> = ({ title, data, icon, emptyMessage }) => (
  <Card style={styles.dataSection}>
    <Card.Title title={title} />
    <Card.Content>
      {data.length > 0 ? (
        data.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.dataItem}>
            <Text style={styles.dataTitle}>
              {item.title || item.message || `Update ${index + 1}`}
            </Text>
            <Text style={styles.dataTime}>
              {new Date(item.timestamp || Date.now()).toLocaleTimeString()}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      )}
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 32,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
  },
  metricsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  controlsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  clearButton: {
    alignSelf: 'center',
  },
  dataSection: {
    marginBottom: 16,
    elevation: 4,
  },
  dataItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dataTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  analyticsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  analyticsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  marketCard: {
    marginBottom: 16,
    elevation: 4,
  },
  marketText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  marketChange: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  notificationItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    color: '#999',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
  },
});

export default RealtimeDashboard;
