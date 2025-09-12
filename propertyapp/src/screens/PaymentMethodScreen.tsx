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

type PaymentMethodScreenProps = NavigationProps<'PaymentList'>;

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'digital';
  name: string;
  details: string;
  isDefault: boolean;
  icon: string;
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    name: 'Visa **** 4242',
    details: 'Expires 12/25',
    isDefault: true,
    icon: '💳',
  },
  {
    id: '2',
    type: 'bank',
    name: 'Chase Checking',
    details: '****1234',
    isDefault: false,
    icon: '🏦',
  },
  {
    id: '3',
    type: 'digital',
    name: 'PayPal',
    details: 'john.doe@email.com',
    isDefault: false,
    icon: '🅿️',
  },
];

export function PaymentMethodScreen({ navigation }: PaymentMethodScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose payment method type',
      [
        { text: 'Credit/Debit Card', onPress: () => navigation.navigate('PaymentList') },
        { text: 'Bank Account', onPress: () => navigation.navigate('PaymentList') },
        { text: 'Digital Wallet', onPress: () => navigation.navigate('PaymentList') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    const selectedPaymentMethod = mockPaymentMethods.find(m => m.id === selectedMethod);
    if (selectedPaymentMethod) {
      navigation.navigate('PaymentDetail', {
        paymentId: 'new-payment',
      });
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.methodCard,
        selectedMethod === method.id && styles.selectedMethod,
      ]}
      onPress={() => handleSelectMethod(method.id)}
    >
      <View style={styles.methodHeader}>
        <View style={styles.methodIcon}>
          <Text style={styles.iconText}>{method.icon}</Text>
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodName}>{method.name}</Text>
          <Text style={styles.methodDetails}>{method.details}</Text>
        </View>
        {method.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      {selectedMethod === method.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Payment Method</Text>
          <Text style={styles.subtitle}>Choose how you'd like to pay your rent</Text>
        </View>

        <View style={styles.methodsContainer}>
          <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
          {mockPaymentMethods.map(renderPaymentMethod)}
        </View>

        <TouchableOpacity
          style={styles.addMethodButton}
          onPress={handleAddPaymentMethod}
        >
          <Text style={styles.addMethodText}>+ Add New Payment Method</Text>
        </TouchableOpacity>

        <View style={styles.quickPayContainer}>
          <Text style={styles.sectionTitle}>Quick Pay Options</Text>
          <TouchableOpacity style={styles.quickPayButton}>
            <Text style={styles.quickPayText}>💰 Pay with Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickPayButton}>
            <Text style={styles.quickPayText}>📱 Pay with Mobile Wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.disabledButton]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Processing...' : 'Continue to Payment'}
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
  methodsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
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
  selectedMethod: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  methodHeader: {
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
  methodDetails: {
    fontSize: 14,
    color: '#6c757d',
  },
  defaultBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addMethodButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addMethodText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickPayContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickPayButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  quickPayText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  continueButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});