
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
