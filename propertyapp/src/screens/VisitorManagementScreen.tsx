
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { visitorService } from '../services/visitorService';
import { Visitor as VisitorType, Delivery as DeliveryType } from '../types/visitor';

type VisitorManagementScreenProps = NavigationProps<'Settings'>;

export function VisitorManagementScreen({ navigation }: VisitorManagementScreenProps) {
  const [visitors, setVisitors] = useState<VisitorType[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryType[]>([]);
  const [activeTab, setActiveTab] = useState<'visitors' | 'deliveries'>('visitors');
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phone: '',
    visitDate: '',
    visitTime: '',
    purpose: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [visitorsData, deliveriesData] = await Promise.all([
        visitorService.getVisitors(),
        visitorService.getDeliveries()
      ]);
      
      setVisitors(visitorsData);
      setDeliveries(deliveriesData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading visitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'APPROVED': return '#28a745';
      case 'DENIED': return '#dc3545';
      case 'COMPLETED': return '#6c757d';
      case 'CANCELLED': return '#6c757d';
      case 'IN_TRANSIT': return '#17a2b8';
      case 'DELIVERED': return '#28a745';
      case 'PICKED_UP': return '#6c757d';
      case 'RETURNED': return '#dc3545';
      case 'LOST': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const handleApproveVisitor = async (visitorId: string) => {
    try {
      const updatedVisitor = await visitorService.approveVisitor(visitorId);
      setVisitors(prev =>
        prev.map(visitor =>
          visitor.id === visitorId ? updatedVisitor : visitor
        )
      );
      Alert.alert('Success', 'Visitor access approved!');
    } catch (err) {
      Alert.alert('Error', 'Failed to approve visitor. Please try again.');
      console.error('Error approving visitor:', err);
    }
  };

  const handleDenyVisitor = (visitorId: string) => {
    Alert.alert(
      'Deny Visitor',
      'Are you sure you want to deny this visitor access?',
      [
        {
          text: 'Deny',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedVisitor = await visitorService.denyVisitor(visitorId);
              setVisitors(prev =>
                prev.map(visitor =>
                  visitor.id === visitorId ? updatedVisitor : visitor
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to deny visitor. Please try again.');
              console.error('Error denying visitor:', err);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePickupDelivery = async (deliveryId: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery && delivery.pickupCode) {
      Alert.alert(
        'Pickup Package',
        'Show this code at the front desk: ' + delivery.pickupCode,
        [
          {
            text: 'Mark as Picked Up',
            onPress: async () => {
              try {
                const updatedDelivery = await visitorService.markDeliveryAsPickedUp(deliveryId);
                setDeliveries(prev =>
                  prev.map(d =>
                    d.id === deliveryId ? updatedDelivery : d
                  )
                );
              } catch (err) {
                Alert.alert('Error', 'Failed to mark delivery as picked up. Please try again.');
                console.error('Error picking up delivery:', err);
              }
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }
  };

  const handleAddVisitor = async () => {
    if (!newVisitor.name.trim() || !newVisitor.visitDate.trim() || !newVisitor.purpose.trim()) {
      Alert.alert('Missing information', 'Name, visit date, and purpose are required.');
      return;
    }

    try {
      const created = await visitorService.createVisitor({
        name: newVisitor.name.trim(),
        phone: newVisitor.phone.trim() || undefined,
        visitDate: newVisitor.visitDate.trim(),
        visitTime: newVisitor.visitTime.trim() || undefined,
        purpose: newVisitor.purpose.trim(),
        notes: newVisitor.notes.trim() || undefined,
      });

      setVisitors(prev => [created, ...prev]);
      setNewVisitor({
        name: '',
        phone: '',
        visitDate: '',
        visitTime: '',
        purpose: '',
        notes: '',
      });
      setShowAddVisitor(false);
      Alert.alert('Success', 'Visitor request created.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create visitor. Please try again.');
      console.error('Error creating visitor:', err);
    }
  };

  const renderVisitorItem = ({ item }: { item: VisitorType }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {item.phone ? <Text style={styles.cardDetail}>Phone: {item.phone}</Text> : null}
      <Text style={styles.cardDetail}>Date: {item.visitDate}</Text>
      {item.visitTime ? <Text style={styles.cardDetail}>Time: {item.visitTime}</Text> : null}
      <Text style={styles.cardDetail}>Purpose: {item.purpose}</Text>
      {item.notes ? <Text style={styles.cardDetail}>Notes: {item.notes}</Text> : null}

      {item.status === 'PENDING' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveVisitor(item.id)}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyVisitor(item.id)}
          >
            <Text style={styles.actionButtonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderDeliveryItem = ({ item }: { item: DeliveryType }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.cardDetail}>Carrier: {item.carrier}</Text>
      <Text style={styles.cardDetail}>Tracking: {item.trackingNumber}</Text>
      <Text style={styles.cardDetail}>Sender: {item.sender}</Text>
      {item.location ? <Text style={styles.cardDetail}>Location: {item.location}</Text> : null}

      {item.pickupCode && item.status === 'DELIVERED' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handlePickupDelivery(item.id)}
          >
            <Text style={styles.actionButtonText}>Pick Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visitor Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddVisitor(prev => !prev)}
        >
          <Text style={styles.addButtonText}>{showAddVisitor ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'visitors' && styles.activeTab]}
          onPress={() => setActiveTab('visitors')}
        >
          <Text style={[styles.tabText, activeTab === 'visitors' && styles.activeTabText]}>
            Visitors ({visitors.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deliveries' && styles.activeTab]}
          onPress={() => setActiveTab('deliveries')}
        >
          <Text style={[styles.tabText, activeTab === 'deliveries' && styles.activeTabText]}>
            Deliveries ({deliveries.length})
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {showAddVisitor && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Visitor name"
            value={newVisitor.name}
            onChangeText={text => setNewVisitor(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            keyboardType="phone-pad"
            value={newVisitor.phone}
            onChangeText={text => setNewVisitor(prev => ({ ...prev, phone: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Visit date (YYYY-MM-DD)"
            value={newVisitor.visitDate}
            onChangeText={text => setNewVisitor(prev => ({ ...prev, visitDate: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Visit time (HH:MM, optional)"
            value={newVisitor.visitTime}
            onChangeText={text => setNewVisitor(prev => ({ ...prev, visitTime: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Purpose"
            value={newVisitor.purpose}
            onChangeText={text => setNewVisitor(prev => ({ ...prev, purpose: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Notes (optional)"
            value={newVisitor.notes}
            onChangeText={text => setNewVisitor(prev => ({ ...prev, notes: text }))}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleAddVisitor}>
            <Text style={styles.submitButtonText}>Create Visitor Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : activeTab === 'visitors' ? (
        <FlatList
          data={visitors}
          keyExtractor={item => item.id}
          renderItem={renderVisitorItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No visitors yet.</Text>
          }
        />
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={item => item.id}
          renderItem={renderDeliveryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No deliveries yet.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: '#000000',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flexShrink: 1,
    marginRight: 8,
  },
  cardDetail: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#28A745',
  },
  denyButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 24,
  },
});
