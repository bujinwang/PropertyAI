import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Text, Card, Button, Chip, Divider, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { maintenanceService } from '@/services/maintenanceService';
import { MaintenanceRequest } from '@/types';

interface MaintenanceDetailsScreenProps {
  route: {
    params: {
      requestId: string;
    };
  };
  navigation: any;
}

export function MaintenanceDetailsScreen({ route, navigation }: MaintenanceDetailsScreenProps) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadMaintenanceDetails();
  }, [requestId]);

  const loadMaintenanceDetails = async () => {
    try {
      setLoading(true);
      const response = await maintenanceService.getMaintenanceRequestById(requestId);
      setRequest(response.data);
    } catch (error) {
      console.error('Error loading maintenance details:', error);
      Alert.alert('Error', 'Failed to load maintenance request details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMaintenanceDetails();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!request) return;

    try {
      setUpdating(true);
      await maintenanceService.updateMaintenanceStatus(requestId, newStatus);
      await loadMaintenanceDetails();
      Alert.alert('Success', `Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#388e3c';
      case 'in_progress':
        return '#1976d2';
      case 'pending':
        return '#f57c00';
      case 'cancelled':
        return '#757575';
      default:
        return '#1976d2';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text>Maintenance request not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Request Header */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall">{request.title}</Text>
            <Text variant="bodyMedium" style={styles.category}>
              {request.category || 'General'}
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                icon="alert"
                style={[styles.chip, { backgroundColor: getPriorityColor(request.priority) }]}
                textStyle={styles.chipText}
              >
                {request.priority}
              </Chip>
              <Chip
                icon="checkbox-marked-circle"
                style={[styles.chip, { backgroundColor: getStatusColor(request.status) }]}
                textStyle={styles.chipText}
              >
                {request.status}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Description */}
        <Card style={styles.card}>
          <Card.Title title="Description" />
          <Card.Content>
            <Text variant="bodyMedium">{request.description}</Text>
          </Card.Content>
        </Card>

        {/* Details */}
        <Card style={styles.card}>
          <Card.Title title="Request Details" />
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Request ID:
              </Text>
              <Text variant="bodyMedium">{request.id}</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Created:
              </Text>
              <Text variant="bodyMedium">
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Last Updated:
              </Text>
              <Text variant="bodyMedium">
                {new Date(request.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            {request.scheduledDate && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text variant="bodyMedium" style={styles.detailLabel}>
                    Scheduled:
                  </Text>
                  <Text variant="bodyMedium">
                    {new Date(request.scheduledDate).toLocaleDateString()}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Photos */}
        {request.photos && request.photos.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Photos" />
            <Card.Content>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {request.photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </Card.Content>
          </Card>
        )}

        {/* Status Update Actions */}
        {request.status !== 'completed' && request.status !== 'cancelled' && (
          <Card style={styles.card}>
            <Card.Title title="Update Status" />
            <Card.Content>
              {request.status === 'pending' && (
                <Button
                  mode="contained"
                  icon="play"
                  onPress={() => handleStatusUpdate('in_progress')}
                  disabled={updating}
                  style={styles.actionButton}
                >
                  Start Work
                </Button>
              )}
              {request.status === 'in_progress' && (
                <Button
                  mode="contained"
                  icon="check"
                  onPress={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  style={styles.actionButton}
                >
                  Mark Complete
                </Button>
              )}
              <Button
                mode="outlined"
                icon="close"
                onPress={() => handleStatusUpdate('cancelled')}
                disabled={updating}
                style={styles.actionButton}
              >
                Cancel Request
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Additional Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              icon="camera"
              onPress={() => navigation.navigate('AddPhotos', { requestId })}
              style={styles.actionButton}
            >
              Add Photos
            </Button>
            <Button
              mode="outlined"
              icon="message"
              onPress={() => navigation.navigate('Messages', { requestId })}
              style={styles.actionButton}
            >
              View Messages
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  category: {
    color: '#666',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    marginVertical: 8,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  actionButton: {
    marginVertical: 6,
  },
  button: {
    marginTop: 16,
  },
});

export default MaintenanceDetailsScreen;
