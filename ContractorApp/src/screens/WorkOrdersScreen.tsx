import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Chip, FAB, Searchbar, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { WorkOrder, WorkOrderStatus } from '../types';
import { apiService } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const WorkOrdersScreen: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | 'ALL'>('ALL');
  
  const navigation = useNavigation();

  const fetchWorkOrders = async () => {
    try {
      const response = await apiService.getWorkOrders();
      if (response.data) {
        setWorkOrders(response.data);
        setFilteredWorkOrders(response.data);
      } else if (response.error) {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch work orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkOrders();
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  useEffect(() => {
    filterWorkOrders();
  }, [searchQuery, filterStatus, workOrders]);

  const filterWorkOrders = () => {
    let filtered = workOrders;

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(wo => wo.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(wo =>
        wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.maintenanceRequest.property.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredWorkOrders(filtered);
  };

  const getStatusColor = (status: WorkOrderStatus): string => {
    switch (status) {
      case 'OPEN':
        return '#FF9800';
      case 'ASSIGNED':
        return '#2196F3';
      case 'IN_PROGRESS':
        return '#4CAF50';
      case 'PENDING_APPROVAL':
        return '#9C27B0';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'EMERGENCY':
        return '#F44336';
      case 'HIGH':
        return '#FF9800';
      case 'MEDIUM':
        return '#FFC107';
      case 'LOW':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderWorkOrderItem = ({ item }: { item: WorkOrder }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('WorkOrderDetail', { id: item.id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.workOrderTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Chip
              mode="outlined"
              textStyle={{ color: getPriorityColor(item.priority), fontSize: 12 }}
              style={[styles.priorityChip, { borderColor: getPriorityColor(item.priority) }]}
            >
              {item.priority}
            </Chip>
          </View>

          <Text style={styles.propertyName}>
            {item.maintenanceRequest.property.name}
            {item.maintenanceRequest.unit && ` - Unit ${item.maintenanceRequest.unit.unitNumber}`}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.cardFooter}>
            <Chip
              icon={() => <Ionicons name="time-outline" size={16} color="white" />}
              mode="flat"
              textStyle={{ color: 'white', fontSize: 12 }}
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            >
              {item.status.replace('_', ' ')}
            </Chip>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const statusFilters: Array<{ label: string; value: WorkOrderStatus | 'ALL' }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending', value: 'PENDING_APPROVAL' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading work orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search work orders..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Button
              mode={filterStatus === item.value ? 'contained' : 'outlined'}
              onPress={() => setFilterStatus(item.value)}
              style={styles.filterButton}
              labelStyle={styles.filterButtonLabel}
            >
              {item.label}
            </Button>
          )}
        />
      </View>

      <FlatList
        data={filteredWorkOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkOrderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No work orders found</Text>
            <Text style={styles.emptySubtext}>
              {filterStatus !== 'ALL' || searchQuery
                ? 'Try adjusting your filters'
                : 'New work orders will appear here'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
        label="Refresh"
      />
    </View>
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
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    marginRight: 8,
    borderRadius: 20,
  },
  filterButtonLabel: {
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    elevation: 2,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workOrderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  priorityChip: {
    height: 28,
  },
  propertyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default WorkOrdersScreen;
