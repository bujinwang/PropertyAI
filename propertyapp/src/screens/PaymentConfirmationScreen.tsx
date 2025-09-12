import React, { useState, useEffect } from 'react';
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

type PaymentConfirmationScreenProps = NavigationProps<'PaymentDetail'>;

interface PaymentDetails {
  amount: number;
  dueDate: string;
  lateFee?: number;
  propertyName: string;
  propertyAddress: string;
  paymentMethod: {
    type: string;
    name: string;
    icon: string;
  };
}

const mockPaymentDetails: PaymentDetails = {
  amount: 1200.00,
  dueDate: '2024-01-01',
  lateFee: 50.00,
  propertyName: 'Sunset Apartments',
  propertyAddress: '123 Main St, Downtown',
  paymentMethod: {
    type: 'card',
    name: 'Visa **** 4242',
    icon: '💳',
  },
};

export function PaymentConfirmationScreen({ navigation, route }: PaymentConfirmationScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails] = useState<PaymentDetails>(mockPaymentDetails);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      navigation.navigate('PaymentList');
    }, 2000);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => navigation.goBack() },
      ]
    );
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

  const totalAmount = paymentDetails.amount + (paymentDetails.lateFee || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Payment</Text>
          <Text style={styles.subtitle}>Review your payment details</Text>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(totalAmount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rent Amount</Text>
              <Text style={styles.detailValue}>{formatCurrency(paymentDetails.amount)}</Text>
            </View>

            {paymentDetails.lateFee && paymentDetails.lateFee > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabelLate}>Late Fee</Text>
                <Text style={styles.detailValueLate}>{formatCurrency(paymentDetails.lateFee)}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>{formatDate(paymentDetails.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.propertySection}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.propertyCard}>
            <Text style={styles.propertyName}>{paymentDetails.propertyName}</Text>
            <Text style={styles.propertyAddress}>{paymentDetails.propertyAddress}</Text>
          </View>
        </View>

        <View style={styles.paymentMethodSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <Text style={styles.iconText}>{paymentDetails.paymentMethod.icon}</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{paymentDetails.paymentMethod.name}</Text>
              <Text style={styles.methodType}>{paymentDetails.paymentMethod.type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            By confirming this payment, you agree to the terms and conditions.
            Payment will be processed immediately and is non-refundable.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isProcessing && styles.disabledButton]}
          onPress={handleConfirmPayment}
          disabled={isProcessing}
        >
          <Text style={styles.confirmButtonText}>
            {isProcessing ? 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}
          </Text>
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
  scrollView: {
    flex: 1,
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
  paymentCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
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
  amountSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  detailLabelLate: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  detailValueLate: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '500',
  },
  propertySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6c757d',
  },
  paymentMethodSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  methodType: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  disclaimerSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});