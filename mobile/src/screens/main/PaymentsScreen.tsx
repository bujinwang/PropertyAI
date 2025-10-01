import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, FAB, Button, Chip, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaymentMethod, PaymentTransaction } from '@/types';
import { paymentService } from '@/services/paymentService';
import { offlineStorageService } from '@/services/offlineStorageService';
import { useNetwork } from '@/contexts/NetworkContext';

export function PaymentsScreen() {
  const theme = useTheme();
  const { isConnected } = useNetwork();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'methods' | 'transactions'>('methods');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'methods') {
        await loadPaymentMethods();
      } else {
        await loadTransactions();
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      // Try to load from offline storage first
      const offlineMethods = await offlineStorageService.getPaymentMethods();

      if (offlineMethods.length > 0) {
        setPaymentMethods(offlineMethods);
      }

      // If online, fetch from API
      if (isConnected) {
        try {
          const response = await paymentService.getPaymentMethods();
          const onlineMethods = response.data;

          // Save to offline storage
          for (const method of onlineMethods) {
            await offlineStorageService.savePaymentMethod(method);
          }

          setPaymentMethods(onlineMethods);
        } catch (error) {
          console.error('Error fetching payment methods from API:', error);
          // Use offline data if API fails
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      // Try to load from offline storage first
      const offlineTransactions = await offlineStorageService.getPaymentTransactions();

      if (offlineTransactions.length > 0) {
        setTransactions(offlineTransactions);
      }

      // If online, fetch from API
      if (isConnected) {
        try {
          const response = await paymentService.getPaymentTransactions();
          const onlineTransactions = response.data.data;

          // Save to offline storage
          for (const transaction of onlineTransactions) {
            await offlineStorageService.savePaymentTransaction(transaction);
          }

          setTransactions(onlineTransactions);
        } catch (error) {
          console.error('Error fetching transactions from API:', error);
          // Use offline data if API fails
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      // Update locally first
      setPaymentMethods(prevMethods =>
        prevMethods.map(method => ({
          ...method,
          isDefault: method.id === methodId,
        }))
      );

      // If online, sync with API
      if (isConnected) {
        try {
          await paymentService.setDefaultPaymentMethod(methodId);
        } catch (error) {
          console.error('Error setting default payment method on API:', error);
          // TODO: Add to sync queue for later
        }
      }

      setMenuVisible(null);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Failed to set default payment method');
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      // Update locally first
      setPaymentMethods(prevMethods =>
        prevMethods.filter(method => method.id !== methodId)
      );

      // If online, sync with API
      if (isConnected) {
        try {
          await paymentService.deletePaymentMethod(methodId);
        } catch (error) {
          console.error('Error deleting payment method on API:', error);
          // TODO: Add to sync queue for later
        }
      }

      setMenuVisible(null);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      Alert.alert('Error', 'Failed to delete payment method');
    }
  };

  const handleAddPaymentMethod = () => {
    // Navigate to add payment method screen
    // Note: This would navigate to AddPaymentMethodScreen when implemented
    Alert.alert(
      'Add Payment Method',
      'This feature will open a secure form to add a new payment method (credit card or bank account).',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK' }
      ]
    );
  };

  const handleProcessPayment = () => {
    // Navigate to process payment screen
    // Note: This would navigate to ProcessPaymentScreen when implemented
    Alert.alert(
      'Process Payment',
      'This feature will allow you to make a payment for rent or other charges.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK' }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return theme.colors.primary;
      case 'pending':
        return theme.colors.secondary;
      case 'processing':
        return theme.colors.tertiary;
      case 'failed':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.onSurfaceVariant;
      case 'refunded':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderPaymentMethodItem = ({ item }: { item: PaymentMethod }) => (
    <Card style={styles.methodCard}>
      <Card.Content>
        <View style={styles.methodHeader}>
          <View style={styles.methodInfo}>
            <Text variant="titleMedium" style={styles.methodTitle}>
              •••• •••• •••• {item.last4}
            </Text>
            <Text variant="bodyMedium" style={styles.methodBrand}>
              {item.brand.toUpperCase()} {item.type.replace('_', ' ')}
            </Text>
          </View>

          <View style={styles.methodActions}>
            {item.isDefault && (
              <Chip mode="flat" style={styles.defaultChip}>
                Default
              </Chip>
            )}
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <Button
                  mode="text"
                  onPress={() => setMenuVisible(item.id)}
                  style={styles.menuButton}
                >
                  ⋮
                </Button>
              }
            >
              {!item.isDefault && (
                <Menu.Item
                  onPress={() => handleSetDefault(item.id)}
                  title="Set as Default"
                />
              )}
              <Divider />
              <Menu.Item
                onPress={() => handleDeleteMethod(item.id)}
                title="Delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>
        </View>

        <Text variant="bodySmall" style={styles.expiryText}>
          Expires {item.expiryMonth.toString().padStart(2, '0')}/{item.expiryYear}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderTransactionItem = ({ item }: { item: PaymentTransaction }) => (
    <Card style={styles.transactionCard}>
      <Card.Content>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text variant="titleMedium" style={styles.transactionAmount}>
              ${item.amount.toFixed(2)}
            </Text>
            <Text variant="bodyMedium" style={styles.transactionDescription}>
              {item.description || 'Payment'}
            </Text>
          </View>

          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.transactionFooter}>
          <Text variant="bodySmall" style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text variant="bodySmall" style={styles.transactionId}>
            ID: {item.id.slice(-8)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && ((activeTab === 'methods' && paymentMethods.length === 0) ||
                  (activeTab === 'transactions' && transactions.length === 0))) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            Loading payment data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Payments
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'methods' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('methods')}
          style={styles.tabButton}
        >
          Payment Methods
        </Button>
        <Button
          mode={activeTab === 'transactions' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('transactions')}
          style={styles.tabButton}
        >
          Transactions
        </Button>
      </View>

      {activeTab === 'methods' ? (
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethodItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No payment methods found
              </Text>
              <Button
                mode="contained"
                onPress={handleAddPaymentMethod}
                style={styles.addButton}
              >
                Add Payment Method
              </Button>
            </View>
          }
        />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No transactions found
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'methods' && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddPaymentMethod}
        />
      )}

      {activeTab === 'transactions' && (
        <FAB
          icon="credit-card"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleProcessPayment}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  methodCard: {
    marginBottom: 12,
    elevation: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  methodBrand: {
    opacity: 0.7,
    marginTop: 4,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultChip: {
    height: 28,
    marginRight: 8,
  },
  menuButton: {
    margin: -8,
  },
  expiryText: {
    opacity: 0.6,
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    fontWeight: 'bold',
  },
  transactionDescription: {
    opacity: 0.8,
    marginTop: 4,
  },
  statusChip: {
    height: 28,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDate: {
    opacity: 0.6,
  },
  transactionId: {
    opacity: 0.6,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});