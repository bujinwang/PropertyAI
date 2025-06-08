import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import PayPal from 'react-native-paypal-checkout';
import { usePlaidLink } from 'react-native-plaid-link-sdk';

const PaymentPortalScreen: React.FC = () => {
  const { confirmPayment } = useStripe();
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const rentAmount = 1200;
  const dueDate = 'July 1, 2025';

  const fetchLinkToken = async () => {
    try {
      const response = await fetch('/api/create-link-token', {
        method: 'POST',
      });
      const { link_token } = await response.json();
      setLinkToken(link_token);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch Plaid link token.');
    }
  };

  useEffect(() => {
    fetchLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    tokenConfig: {
      token: linkToken,
    },
    onSuccess: (success: any) => {
      handlePlaidSuccess(success);
    },
    onExit: (exit: any) => {
      console.log(exit);
    },
  });

  const handlePlaidSuccess = async (success: any) => {
    try {
      // Send public_token to your backend to exchange for an access_token
      const response = await fetch('/api/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token: success.publicToken }),
      });

      const { access_token } = await response.json();

      // Use the access_token to initiate an ACH payment
      const achResponse = await fetch('/api/charge-ach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token,
          amount: rentAmount,
          accountId: success.metadata.accounts[0].id,
        }),
      });

      const achResult = await achResponse.json();

      if (achResult.success) {
        Alert.alert('Success', 'ACH payment initiated successfully.');
      } else {
        Alert.alert('Error', 'ACH payment failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong with Plaid. Please try again.');
    }
  };

  const handlePayPalPayment = async () => {
    try {
      const {
        nonce,
        payerId,
      } = await PayPal.pay({
        price: rentAmount.toString(),
        currency: 'USD',
        description: 'Rent Payment',
      });

      // Send nonce to your backend for processing
      const response = await fetch('/api/process-paypal-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          payerId,
          amount: rentAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'PayPal payment successful!');
      } else {
        Alert.alert('Error', 'PayPal payment failed. Please try again.');
      }
    } catch (error: any) {
      if (error.code === 'USER_CANCELLED') {
        Alert.alert('Cancelled', 'Payment cancelled by user.');
      } else {
        Alert.alert('Error', 'Something went wrong with PayPal. Please try again.');
      }
    }
  };

  const handlePayment = async () => {
    if (!isCardComplete) {
      Alert.alert('Error', 'Please enter your card details.');
      return;
    }

    try {
      // 1. Create a payment intent on your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: rentAmount * 100, // amount in cents
        }),
      });
      const { clientSecret } = await response.json();

      // 2. Confirm the payment on the client
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else if (paymentIntent) {
        Alert.alert('Success', 'Payment successful!');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rent Payment</Text>

      <View style={styles.rentInfoContainer}>
        <Text style={styles.rentAmount}>${rentAmount.toFixed(2)}</Text>
        <Text style={styles.dueDate}>Due on {dueDate}</Text>
      </View>

      <Text style={styles.paymentMethodHeader}>Pay with Card</Text>
      <CardField
        postalCodeEnabled={false}
        style={styles.cardField}
        onCardChange={(cardDetails) => {
          setIsCardComplete(cardDetails.complete);
        }}
      />

      <TouchableOpacity style={styles.paymentMethodButton} onPress={handlePayment}>
        <Text style={styles.paymentMethodButtonText}>Pay with Card</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.paymentMethodButton} onPress={handlePayPalPayment}>
        <Text style={styles.paymentMethodButtonText}>Pay with PayPal</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.paymentMethodButton, !ready && styles.disabledButton]}
        onPress={() => open()}
        disabled={!ready}
      >
        <Text style={styles.paymentMethodButtonText}>Pay with Bank Account (ACH)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  rentInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  rentAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007bff',
  },
  dueDate: {
    fontSize: 16,
    color: '#6c757d',
  },
  paymentMethodHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  paymentMethodButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  paymentMethodButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  cardField: {
    height: 50,
    marginVertical: 30,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
});

export default PaymentPortalScreen;
