import React, { useState, useEffect, Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TenantDashboardNavigationProp } from '@/navigation/types';
import { useAuth } from '@/contexts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface TenantDashboardData {
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    unitNumber?: string;
    propertyName?: string;
  };
  rentInfo: {
    currentRent: number;
    dueDate: string;
    isPaid: boolean;
    lastPaymentDate?: string;
    outstandingBalance: number;
  };
  maintenanceRequests: Array<{
    id: string;
    title: string;
    status: 'open' | 'in_progress' | 'completed' | 'closed';
    createdAt: string;
    priority: 'low' | 'medium' | 'high' | 'emergency';
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    createdAt: string;
    isRead: boolean;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: 'lease' | 'notice' | 'receipt' | 'other';
    uploadDate: string;
  }>;
}

// Error Boundary Component for better error handling
class TenantDashboardErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('TenantDashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            <Text style={styles.errorText}>Something went wrong</Text>
            <Button
              title="Try Again"
              onPress={() => this.setState({ hasError: false })}
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export const TenantDashboardScreen: React.FC = () => {
  const navigation = useNavigation<TenantDashboardNavigationProp>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null);

  // Mock data for initial implementation - replace with actual API calls
  const mockDashboardData: TenantDashboardData = {
    userInfo: {
      firstName: user?.firstName || 'John',
      lastName: user?.lastName || 'Doe',
      email: user?.email || 'john.doe@example.com',
      unitNumber: '101',
      propertyName: 'Sunset Apartments',
    },
    rentInfo: {
      currentRent: 1500,
      dueDate: '2024-01-01',
      isPaid: false,
      outstandingBalance: 1500,
    },
    maintenanceRequests: [
      {
        id: '1',
        title: 'Leaky faucet in kitchen',
        status: 'in_progress',
        createdAt: '2023-12-15',
        priority: 'medium',
      },
      {
        id: '2',
        title: 'Heating not working',
        status: 'completed',
        createdAt: '2023-12-10',
        priority: 'high',
      },
    ],
    notifications: [
      {
        id: '1',
        title: 'Rent Due Soon',
        message: 'Your rent of $1,500 is due on January 1st, 2024',
        type: 'warning',
        createdAt: '2023-12-28',
        isRead: false,
      },
      {
        id: '2',
        title: 'Maintenance Update',
        message: 'Your maintenance request has been completed',
        type: 'info',
        createdAt: '2023-12-20',
        isRead: true,
      },
    ],
    documents: [
      {
        id: '1',
        name: 'Lease Agreement 2024',
        type: 'lease',
        uploadDate: '2023-12-01',
      },
      {
        id: '2',
        name: 'Rent Receipt December 2023',
        type: 'receipt',
        uploadDate: '2023-12-01',
      },
    ],
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Set mock data
      setDashboardData(mockDashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handlePayRent = () => {
    navigation.navigate('PaymentList');
  };

  const handleVisitorManagement = () => {
    navigation.navigate('VisitorManagement');
  };

  const handleSubmitMaintenance = () => {
    navigation.navigate('MaintenanceForm', {});
  };

  const handleViewDocument = (documentId: string) => {
    // For now, just navigate to a generic screen - can be enhanced later
    console.log('View document:', documentId);
  };

  const handleNotificationPress = (notificationId: string) => {
    // Mark notification as read and navigate to relevant screen
    console.log('Notification pressed:', notificationId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMaintenanceStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'active' as const;
      case 'in_progress':
        return 'pending' as const;
      case 'open':
        return 'inactive' as const;
      default:
        return 'inactive' as const;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load dashboard data</Text>
          <Button title="Retry" onPress={loadDashboardData} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TenantDashboardErrorBoundary>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text
            style={styles.welcomeText}
            accessibilityRole="header"
            accessibilityLabel={`Welcome back ${dashboardData.userInfo.firstName}`}
          >
            Welcome back, {dashboardData.userInfo.firstName}!
          </Text>
          <Text
            style={styles.propertyText}
            accessibilityLabel={`Property: ${dashboardData.userInfo.propertyName}, Unit ${dashboardData.userInfo.unitNumber}`}
          >
            {dashboardData.userInfo.propertyName} - Unit {dashboardData.userInfo.unitNumber}
          </Text>
        </View>

        {/* Rent Status Card */}
        <Card style={styles.rentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Rent Status</Text>
          </View>

          <View style={styles.rentInfo}>
            <Text
              style={styles.rentAmount}
              accessibilityLabel={`Rent amount: ${formatCurrency(dashboardData.rentInfo.currentRent)}`}
            >
              {formatCurrency(dashboardData.rentInfo.currentRent)}
            </Text>
            <Text
              style={styles.rentDueDate}
              accessibilityLabel={`Due date: ${formatDate(dashboardData.rentInfo.dueDate)}`}
            >
              Due: {formatDate(dashboardData.rentInfo.dueDate)}
            </Text>
            <StatusBadge
              status={dashboardData.rentInfo.isPaid ? 'active' : 'pending'}
              text={dashboardData.rentInfo.isPaid ? 'Paid' : 'Pending'}
            />
          </View>

          {!dashboardData.rentInfo.isPaid && (
            <Button
              title="Pay Rent Now"
              onPress={handlePayRent}
              style={styles.payButton}
            />
          )}
        </Card>

        {/* Maintenance Requests Card */}
        <Card style={styles.maintenanceCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="construct" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Maintenance Requests</Text>
            <TouchableOpacity
              onPress={handleSubmitMaintenance}
              accessibilityRole="button"
              accessibilityLabel="Add new maintenance request"
              accessibilityHint="Opens form to submit a new maintenance request"
            >
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {dashboardData.maintenanceRequests.length === 0 ? (
            <Text style={styles.emptyText}>No maintenance requests</Text>
          ) : (
            dashboardData.maintenanceRequests.slice(0, 3).map((request) => (
              <View key={request.id} style={styles.maintenanceItem}>
                <View style={styles.maintenanceItemHeader}>
                  <Text style={styles.maintenanceTitle}>{request.title}</Text>
                  <StatusBadge
                    status={getMaintenanceStatusBadge(request.status)}
                    text={request.status.replace('_', ' ')}
                  />
                </View>
                <Text style={styles.maintenanceDate}>
                  {formatDate(request.createdAt)}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Notifications Card */}
        <Card style={styles.notificationsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>

          {dashboardData.notifications.length === 0 ? (
            <Text style={styles.emptyText}>No notifications</Text>
          ) : (
            dashboardData.notifications.slice(0, 3).map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
                onPress={() => handleNotificationPress(notification.id)}
                accessibilityRole="button"
                accessibilityLabel={`${notification.isRead ? 'Read' : 'Unread'} notification: ${notification.title}`}
                accessibilityHint="Tap to view notification details"
              >
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.isRead && (
                    <View
                      style={styles.unreadDot}
                      accessibilityLabel="Unread notification indicator"
                    />
                  )}
                </View>
                <Text
                  style={styles.notificationMessage}
                  numberOfLines={2}
                  accessibilityLabel={`Message: ${notification.message}`}
                >
                  {notification.message}
                </Text>
                <Text
                  style={styles.notificationDate}
                  accessibilityLabel={`Received on ${formatDate(notification.createdAt)}`}
                >
                  {formatDate(notification.createdAt)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* Documents Card */}
        <Card style={styles.documentsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="document" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Documents</Text>
          </View>

          {dashboardData.documents.length === 0 ? (
            <Text style={styles.emptyText}>No documents available</Text>
          ) : (
            dashboardData.documents.slice(0, 3).map((document) => (
              <TouchableOpacity
                key={document.id}
                style={styles.documentItem}
                onPress={() => handleViewDocument(document.id)}
                accessibilityRole="button"
                accessibilityLabel={`${document.type} document: ${document.name}, uploaded ${formatDate(document.uploadDate)}`}
                accessibilityHint="Tap to view or download this document"
              >
                <View style={styles.documentIcon}>
                  <Ionicons
                    name={
                      document.type === 'lease' ? 'document-text' :
                      document.type === 'receipt' ? 'receipt' :
                      document.type === 'notice' ? 'alert-circle' : 'document'
                    }
                    size={20}
                    color={COLORS.primary}
                    accessibilityLabel={`${document.type} icon`}
                  />
                </View>
                <View style={styles.documentInfo}>
                  <Text
                    style={styles.documentName}
                    accessibilityLabel={`Document name: ${document.name}`}
                  >
                    {document.name}
                  </Text>
                  <Text
                    style={styles.documentDate}
                    accessibilityLabel={`Upload date: ${formatDate(document.uploadDate)}`}
                  >
                    {formatDate(document.uploadDate)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.text.secondary}
                  accessibilityLabel="Go to document"
                />
              </TouchableOpacity>
            ))
          )}
        </Card>
        </ScrollView>
      </SafeAreaView>
    </TenantDashboardErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  headerSection: {
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  propertyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
  },
  rentCard: {
    marginBottom: SPACING.md,
  },
  maintenanceCard: {
    marginBottom: SPACING.md,
  },
  notificationsCard: {
    marginBottom: SPACING.md,
  },
  documentsCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  rentInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rentAmount: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700' as const,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  rentDueDate: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  payButton: {
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    padding: SPACING.md,
  },
  maintenanceItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  maintenanceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  maintenanceTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500' as const,
    color: COLORS.text.primary,
    flex: 1,
  },
  maintenanceDate: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  notificationItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500' as const,
    color: COLORS.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  notificationDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  documentIcon: {
    marginRight: SPACING.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  documentDate: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  visitorCard: {
    marginBottom: SPACING.md,
  },
  visitorInfo: {
    marginBottom: SPACING.md,
  },
  visitorDescription: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  visitorButton: {
    marginTop: SPACING.md,
  },
});

export default TenantDashboardScreen;
