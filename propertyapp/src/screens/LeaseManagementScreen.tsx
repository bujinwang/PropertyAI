import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type LeaseManagementScreenProps = NavigationProps<'Settings'>;

interface Lease {
  id: string;
  propertyName: string;
  propertyAddress: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'active' | 'pending' | 'expired' | 'terminated';
  signedDate?: string;
  nextPaymentDate: string;
  documentUrl: string;
  canRenew: boolean;
  renewalOptions?: {
    newEndDate: string;
    newMonthlyRent: number;
    increasePercentage: number;
  };
}

const mockLeases: Lease[] = [
  {
    id: '1',
    propertyName: 'Sunset Apartments - Unit 204',
    propertyAddress: '123 Main St, Downtown',
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    monthlyRent: 1200,
    securityDeposit: 1200,
    status: 'active',
    signedDate: '2023-12-15',
    nextPaymentDate: '2024-02-01',
    documentUrl: 'lease_204.pdf',
    canRenew: true,
    renewalOptions: {
      newEndDate: '2026-01-01',
      newMonthlyRent: 1260,
      increasePercentage: 5,
    },
  },
  {
    id: '2',
    propertyName: 'Riverside Condo - Unit 12B',
    propertyAddress: '456 River Rd, Uptown',
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    monthlyRent: 1500,
    securityDeposit: 1500,
    status: 'expired',
    signedDate: '2023-05-15',
    nextPaymentDate: '2024-06-01',
    documentUrl: 'lease_12b.pdf',
    canRenew: false,
  },
];

export function LeaseManagementScreen({ navigation }: LeaseManagementScreenProps) {
  const [leases, setLeases] = useState<Lease[]>(mockLeases);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'pending': return '#ffc107';
      case 'expired': return '#6c757d';
      case 'terminated': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLeasePress = (lease: Lease) => {
    setSelectedLease(lease);
  };

  const handleViewLease = (lease: Lease) => {
    // Navigate to document viewer
    navigation.navigate('Settings'); // Mock navigation
    Alert.alert('Lease Document', `Opening ${lease.documentUrl}...`);
  };

  const handleRenewLease = (lease: Lease) => {
    if (!lease.renewalOptions) return;

    Alert.alert(
      'Renew Lease',
      `Renew your lease with a ${lease.renewalOptions.increasePercentage}% increase to ${formatCurrency(lease.renewalOptions.newMonthlyRent)}/month?`,
      [
        {
          text: 'Renew Now',
          onPress: () => {
            Alert.alert('Success', 'Lease renewal request submitted. You will receive a confirmation email.');
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTerminateLease = (lease: Lease) => {
    Alert.alert(
      'Terminate Lease',
      'Are you sure you want to terminate this lease? This action cannot be undone and may result in penalties.',
      [
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Lease Termination', 'Termination request submitted. Please contact management for next steps.');
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderLeaseCard = (lease: Lease) => (
    <TouchableOpacity
      key={lease.id}
      style={styles.leaseCard}
      onPress={() => handleLeasePress(lease)}
    >
      <View style={styles.leaseHeader}>
        <View style={styles.leaseInfo}>
          <Text style={styles.propertyName} numberOfLines={2}>
            {lease.propertyName}
          </Text>
          <Text style={styles.propertyAddress} numberOfLines={1}>
            {lease.propertyAddress}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lease.status) }]}>
            <Text style={styles.statusText}>{getStatusText(lease.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.leaseDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Lease Period</Text>
          <Text style={styles.detailValue}>
            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Rent</Text>
          <Text style={styles.detailValue}>{formatCurrency(lease.monthlyRent)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Security Deposit</Text>
          <Text style={styles.detailValue}>{formatCurrency(lease.securityDeposit)}</Text>
        </View>

        {lease.signedDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Signed On</Text>
            <Text style={styles.detailValue}>{formatDate(lease.signedDate)}</Text>
          </View>
        )}
      </View>

      <View style={styles.leaseActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewLease(lease)}
        >
          <Text style={styles.actionButtonText}>View Lease</Text>
        </TouchableOpacity>

        {lease.canRenew && lease.renewalOptions && (
          <TouchableOpacity
            style={[styles.actionButton, styles.renewButton]}
            onPress={() => handleRenewLease(lease)}
          >
            <Text style={styles.renewButtonText}>Renew</Text>
          </TouchableOpacity>
        )}

        {lease.status === 'active' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.terminateButton]}
            onPress={() => handleTerminateLease(lease)}
          >
            <Text style={styles.terminateButtonText}>Terminate</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderLeaseDetails = () => {
    if (!selectedLease) return null;

    return (
      <View style={styles.detailsModal}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Lease Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedLease(null)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailsContent}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Property Information</Text>
            <Text style={styles.sectionText}>{selectedLease.propertyName}</Text>
            <Text style={styles.sectionText}>{selectedLease.propertyAddress}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Financial Details</Text>
            <View style={styles.financialGrid}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Monthly Rent</Text>
                <Text style={styles.financialValue}>{formatCurrency(selectedLease.monthlyRent)}</Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Security Deposit</Text>
                <Text style={styles.financialValue}>{formatCurrency(selectedLease.securityDeposit)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Lease Terms</Text>
            <Text style={styles.sectionText}>
              Start Date: {formatDate(selectedLease.startDate)}
            </Text>
            <Text style={styles.sectionText}>
              End Date: {formatDate(selectedLease.endDate)}
            </Text>
            <Text style={styles.sectionText}>
              Next Payment: {formatDate(selectedLease.nextPaymentDate)}
            </Text>
          </View>

          {selectedLease.renewalOptions && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Renewal Options</Text>
              <View style={styles.renewalCard}>
                <Text style={styles.renewalText}>
                  New Monthly Rent: {formatCurrency(selectedLease.renewalOptions.newMonthlyRent)}
                </Text>
                <Text style={styles.renewalText}>
                  Increase: {selectedLease.renewalOptions.increasePercentage}%
                </Text>
                <Text style={styles.renewalText}>
                  New End Date: {formatDate(selectedLease.renewalOptions.newEndDate)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lease Management</Text>
        <Text style={styles.subtitle}>View and manage your lease agreements</Text>
      </View>

      <ScrollView style={styles.leaseList}>
        <View style={styles.leasesContainer}>
          {leases.map(renderLeaseCard)}
        </View>
      </ScrollView>

      {renderLeaseDetails()}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Need Help?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  leaseList: {
    flex: 1,
  },
  leasesContainer: {
    padding: 20,
  },
  leaseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  leaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leaseInfo: {
    flex: 1,
    marginRight: 12,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6c757d',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  leaseDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  detailValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  leaseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  renewButton: {
    backgroundColor: '#28a745',
  },
  renewButtonText: {
    color: '#fff',
  },
  terminateButton: {
    backgroundColor: '#dc3545',
  },
  terminateButtonText: {
    color: '#fff',
  },
  detailsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  financialGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  financialItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  renewalCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#b8daff',
  },
  renewalText: {
    fontSize: 14,
    color: '#004085',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  helpButton: {
    backgroundColor: '#6c757d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});