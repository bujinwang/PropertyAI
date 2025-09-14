import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Searchbar, Chip, Card, useTheme, ActivityIndicator, FAB, Button, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaintenanceRequest } from '@/types';
import { maintenanceService } from '@/services/maintenanceService';
import { offlineStorageService } from '@/services/offlineStorageService';
import { useNetwork } from '@/contexts/NetworkContext';

export function MaintenanceScreen() {
  const theme = useTheme();
  const { isConnected } = useNetwork();

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    loadMaintenanceRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, selectedStatus, selectedPriority]);

  const loadMaintenanceRequests = async () => {
    try {
      setLoading(true);

      // Try to load from offline storage first
      const offlineRequests = await offlineStorageService.getMaintenanceRequests();

      if (offlineRequests.length > 0) {
        setRequests(offlineRequests);
      }

      // If online, fetch from API
      if (isConnected) {
        try {
          const response = await maintenanceService.getMaintenanceRequests();
          const onlineRequests = response.data.data;

          // Save to offline storage
          for (const request of onlineRequests) {
            await offlineStorageService.saveMaintenanceRequest(request);
          }

          setRequests(onlineRequests);
        } catch (error) {
          console.error('Error fetching maintenance requests from API:', error);
          // Use offline data if API fails
        }
      }
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(request => request.priority === selectedPriority);
    }

    setFilteredRequests(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMaintenanceRequests();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      // Update locally first
      await offlineStorageService.updateMaintenanceStatus(requestId, newStatus);

      // Update in state
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: newStatus as any, updatedAt: new Date().toISOString() }
            : request
        )
      );

      // If online, sync with API
      if (isConnected) {
        try {
          await maintenanceService.updateMaintenanceStatus(requestId, newStatus);
        } catch (error) {
          console.error('Error updating status on API:', error);
          // TODO: Add to sync queue for later
        }
      }

      setMenuVisible(null);
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      Alert.alert('Error', 'Failed to update maintenance status');
    }
  };

  const handleCreateRequest = () => {
    // TODO: Navigate to create maintenance request screen
    console.log('Create maintenance request');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return theme.colors.onSurfaceVariant;
      case 'assigned':
        return theme.colors.primary;
      case 'in_progress':
        return theme.colors.secondary;
      case 'completed':
        return theme.colors.tertiary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return theme.colors.onSurfaceVariant;
      case 'medium':
        return theme.colors.secondary;
      case 'high':
        return theme.colors.error;
      case 'emergency':
        return '#d32f2f';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(requests.map(r => r.status))];
    return ['all', ...statuses];
  };

  const getUniquePriorities = () => {
    const priorities = [...new Set(requests.map(r => r.priority))];
    return ['all', ...priorities];
  };

  const renderRequestItem = ({ item }: { item: MaintenanceRequest }) => (
    <Card style={styles.requestCard}>
      <Card.Content>
        <View style={styles.requestHeader}>
          <Text variant="titleMedium" style={styles.requestTitle} numberOfLines={1}>
            {item.title}
          </Text>
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
            <Menu.Item
              onPress={() => handleStatusUpdate(item.id, 'ASSIGNED')}
              title="Mark as Assigned"
            />
            <Menu.Item
              onPress={() => handleStatusUpdate(item.id, 'IN_PROGRESS')}
              title="Mark as In Progress"
            />
            <Menu.Item
              onPress={() => handleStatusUpdate(item.id, 'COMPLETED')}
              title="Mark as Completed"
            />
            <Divider />
            <Menu.Item
              onPress={() => handleStatusUpdate(item.id, 'CANCELLED')}
              title="Cancel Request"
            />
          </Menu>
        </View>

        <Text variant="bodyMedium" style={styles.requestDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.requestMeta}>
          <View style={styles.chipContainer}>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
              textStyle={{ color: getStatusColor(item.status) }}
            >
              {item.status.replace('_', ' ')}
            </Chip>
            <Chip
              mode="outlined"
              style={[styles.priorityChip, { borderColor: getPriorityColor(item.priority) }]}
              textStyle={{ color: getPriorityColor(item.priority) }}
            >
              {item.priority}
            </Chip>
          </View>

          <Text variant="bodySmall" style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {item.scheduledDate && (
          <Text variant="bodySmall" style={styles.scheduledText}>
            Scheduled: {new Date(item.scheduledDate).toLocaleDateString()}
          </Text>
        )}

        {item.estimatedCost && (
          <Text variant="bodySmall" style={styles.costText}>
            Est. Cost: ${item.estimatedCost.toLocaleString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading && requests.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            Loading maintenance requests...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Maintenance
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search maintenance requests..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text variant="bodyMedium" style={styles.filterLabel}>Status:</Text>
          <View style={styles.chipContainer}>
            {getUniqueStatuses().map(status => (
              <Chip
                key={status}
                mode={selectedStatus === status ? 'flat' : 'outlined'}
                onPress={() => setSelectedStatus(status)}
                style={styles.filterChip}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text variant="bodyMedium" style={styles.filterLabel}>Priority:</Text>
          <View style={styles.chipContainer}>
            {getUniquePriorities().map(priority => (
              <Chip
                key={priority}
                mode={selectedPriority === priority ? 'flat' : 'outlined'}
                onPress={() => setSelectedPriority(priority)}
                style={styles.filterChip}
              >
                {priority === 'all' ? 'All' : priority}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
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
              {searchQuery || selectedStatus !== 'all' || selectedPriority !== 'all'
                ? 'No maintenance requests match your filters'
                : 'No maintenance requests found'
              }
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateRequest}
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    minWidth: 60,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    marginBottom: 12,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    flex: 1,
    marginRight: 8,
  },
  menuButton: {
    margin: -8,
  },
  requestDescription: {
    marginBottom: 12,
    opacity: 0.8,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
    marginRight: 8,
  },
  priorityChip: {
    height: 28,
  },
  dateText: {
    opacity: 0.6,
  },
  scheduledText: {
    opacity: 0.7,
    fontStyle: 'italic',
  },
  costText: {
    opacity: 0.7,
    fontWeight: 'bold',
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});