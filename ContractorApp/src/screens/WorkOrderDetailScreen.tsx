import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WorkOrder, WorkOrderStatus } from '../types';
import { apiService } from '../services/api';

interface RouteParams {
  id: string;
}

const WorkOrderDetailScreen: React.FC = () => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDetails, setQuoteDetails] = useState('');

  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as RouteParams;

  useEffect(() => {
    fetchWorkOrderDetails();
  }, [id]);

  const fetchWorkOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWorkOrderDetails(id);
      if (response.data) {
        setWorkOrder(response.data);
      } else if (response.error) {
        Alert.alert('Error', response.error);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch work order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptWorkOrder = async () => {
    Alert.alert(
      'Accept Work Order',
      'Are you sure you want to accept this work order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await apiService.acceptWorkOrder(id);
              if (response.data) {
                setWorkOrder(response.data);
                Alert.alert('Success', 'Work order accepted successfully');
              } else if (response.error) {
                Alert.alert('Error', response.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to accept work order');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeclineWorkOrder = async () => {
    Alert.alert(
      'Decline Work Order',
      'Are you sure you want to decline this work order? It will be reassigned to another contractor.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await apiService.declineWorkOrder(id);
              if (!response.error) {
                Alert.alert('Success', 'Work order declined successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('Error', response.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to decline work order');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (status: WorkOrderStatus) => {
    try {
      setActionLoading(true);
      const response = await apiService.updateWorkOrderStatus(id, status);
      if (response.data) {
        setWorkOrder(response.data);
        setShowStatusDialog(false);
        Alert.alert('Success', 'Status updated successfully');
      } else if (response.error) {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitQuote = async () => {
    if (!quoteAmount || !quoteDetails) {
      Alert.alert('Error', 'Please fill in all quote fields');
      return;
    }

    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiService.submitQuote(id, amount, quoteDetails);
      if (response.data) {
        setShowQuoteDialog(false);
        setQuoteAmount('');
        setQuoteDetails('');
        await fetchWorkOrderDetails(); // Refresh to show new quote
        Alert.alert('Success', 'Quote submitted successfully');
      } else if (response.error) {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quote');
    } finally {
      setActionLoading(false);
    }
  };

  const openMaps = (address: string) => {
    const url = Platform.OS === 'ios' 
      ? `maps:0,0?q=${encodeURIComponent(address)}`
      : `geo:0,0?q=${encodeURIComponent(address)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Maps not available');
      }
    });
  };

  const getStatusColor = (status: WorkOrderStatus): string => {
    switch (status) {
      case 'OPEN': return '#FF9800';
      case 'ASSIGNED': return '#2196F3';
      case 'IN_PROGRESS': return '#4CAF50';
      case 'PENDING_APPROVAL': return '#9C27B0';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'EMERGENCY': return '#F44336';
      case 'HIGH': return '#FF9800';
      case 'MEDIUM': return '#FFC107';
      case 'LOW': return '#4CAF50';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const canAcceptDecline = workOrder?.status === 'ASSIGNED';
  const canUpdateStatus = workOrder?.status === 'IN_PROGRESS' || workOrder?.status === 'ASSIGNED';
  const canSubmitQuote = workOrder?.status === 'ASSIGNED' || workOrder?.status === 'OPEN';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading work order...</Text>
      </View>
    );
  }

  if (!workOrder) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Work order not found</Text>
      </View>
    );
  }

  const property = workOrder.maintenanceRequest.property;
  const unit = workOrder.maintenanceRequest.unit;
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>{workOrder.title}</Text>
            <View style={styles.chipContainer}>
              <Chip
                mode="flat"
                textStyle={{ color: 'white', fontSize: 12 }}
                style={[styles.statusChip, { backgroundColor: getStatusColor(workOrder.status) }]}
              >
                {workOrder.status.replace('_', ' ')}
              </Chip>
              <Chip
                mode="outlined"
                textStyle={{ color: getPriorityColor(workOrder.priority), fontSize: 12 }}
                style={[styles.priorityChip, { borderColor: getPriorityColor(workOrder.priority) }]}
              >
                {workOrder.priority}
              </Chip>
            </View>
          </View>
          <Text style={styles.dateText}>Created: {formatDate(workOrder.createdAt)}</Text>
        </Card.Content>
      </Card>

      {/* Property Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Property Information</Text>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{property.name}</Text>
            {unit && <Text style={styles.unitText}>Unit: {unit.unitNumber}</Text>}
            <TouchableOpacity onPress={() => openMaps(fullAddress)} style={styles.addressContainer}>
              <Text style={styles.address}>{fullAddress}</Text>
              <Ionicons name="location-outline" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Description */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{workOrder.description}</Text>
        </Card.Content>
      </Card>

      {/* Quotes */}
      {workOrder.quotes.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quotes</Text>
            {workOrder.quotes.map((quote) => (
              <View key={quote.id} style={styles.quoteItem}>
                <View style={styles.quoteHeader}>
                  <Text style={styles.quoteAmount}>${quote.amount.toFixed(2)}</Text>
                  <Text style={styles.quoteDate}>{formatDate(quote.createdAt)}</Text>
                </View>
                <Text style={styles.quoteDetails}>{quote.details}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <View style={styles.actionButtons}>
            {canAcceptDecline && (
              <View style={styles.acceptDeclineButtons}>
                <Button
                  mode="contained"
                  onPress={handleAcceptWorkOrder}
                  disabled={actionLoading}
                  style={[styles.actionButton, styles.acceptButton]}
                  icon="check"
                >
                  Accept
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleDeclineWorkOrder}
                  disabled={actionLoading}
                  style={[styles.actionButton, styles.declineButton]}
                  icon="close"
                >
                  Decline
                </Button>
              </View>
            )}

            {canSubmitQuote && (
              <Button
                mode="contained"
                onPress={() => setShowQuoteDialog(true)}
                disabled={actionLoading}
                style={styles.actionButton}
                icon="calculator"
              >
                Submit Quote
              </Button>
            )}

            {canUpdateStatus && (
              <Button
                mode="contained"
                onPress={() => setShowStatusDialog(true)}
                disabled={actionLoading}
                style={styles.actionButton}
                icon="update"
              >
                Update Status
              </Button>
            )}

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Messages', { workOrderId: workOrder.id })}
              disabled={actionLoading}
              style={styles.actionButton}
              icon="message"
            >
              Messages
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Quote Dialog */}
      <Portal>
        <Dialog visible={showQuoteDialog} onDismiss={() => setShowQuoteDialog(false)}>
          <Dialog.Title>Submit Quote</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Amount ($)"
              value={quoteAmount}
              onChangeText={setQuoteAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Details"
              value={quoteDetails}
              onChangeText={setQuoteDetails}
              multiline
              numberOfLines={4}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowQuoteDialog(false)}>Cancel</Button>
            <Button onPress={handleSubmitQuote} loading={actionLoading}>
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Status Dialog */}
      <Portal>
        <Dialog visible={showStatusDialog} onDismiss={() => setShowStatusDialog(false)}>
          <Dialog.Title>Update Status</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>Select new status:</Text>
            <View style={styles.statusOptions}>
              <Button
                mode="outlined"
                onPress={() => handleUpdateStatus('IN_PROGRESS')}
                style={styles.statusButton}
                disabled={actionLoading}
              >
                In Progress
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleUpdateStatus('PENDING_APPROVAL')}
                style={styles.statusButton}
                disabled={actionLoading}
              >
                Pending Approval
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleUpdateStatus('COMPLETED')}
                style={styles.statusButton}
                disabled={actionLoading}
              >
                Completed
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowStatusDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  chipContainer: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 8,
  },
  priorityChip: {
    height: 28,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  propertyInfo: {
    marginBottom: 8,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 14,
    color: '#2196F3',
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  quoteItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quoteAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quoteDate: {
    fontSize: 12,
    color: '#666',
  },
  quoteDetails: {
    fontSize: 14,
    color: '#333',
  },
  actionButtons: {
    gap: 12,
  },
  acceptDeclineButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    flex: 1,
    borderColor: '#F44336',
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 16,
  },
  statusOptions: {
    gap: 8,
  },
  statusButton: {
    borderRadius: 8,
  },
});

export default WorkOrderDetailScreen;
