import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

interface PaymentMethodProps {
  onPaymentMethodAdded: (paymentMethodId: string) => void;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  onPaymentMethodAdded,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [status, setStatus] = useState('');

  const addPaymentMethod = async () => {
    try {
      setStatus('Adding payment method...');
      const response = await fetch('/api/payments/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'card',
          card: {
            number: cardNumber,
            exp_month: parseInt(expMonth, 10),
            exp_year: parseInt(expYear, 10),
            cvc,
          },
        }),
      });
      const json = await response.json();
      onPaymentMethodAdded(json.id);
      setStatus(`Payment method added: ${json.id}`);
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error adding payment method: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
    }
  };

  return (
    <View>
      <Text>Add Payment Method</Text>
      <TextInput placeholder="Card Number" onChangeText={setCardNumber} />
      <TextInput placeholder="Exp. Month" onChangeText={setExpMonth} />
      <TextInput placeholder="Exp. Year" onChangeText={setExpYear} />
      <TextInput placeholder="CVC" onChangeText={setCvc} />
      <Button title="Add Payment Method" onPress={addPaymentMethod} />
      {status && <Text>{status}</Text>}
    </View>
  );
};

export default PaymentMethod;
