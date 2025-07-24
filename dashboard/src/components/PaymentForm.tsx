import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
} from '@stripe/react-stripe-js';
import * as apiService from '../services/apiService';

interface PaymentFormProps {
  leaseId: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ leaseId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaseDetails = async () => {
      try {
        const lease = await apiService.getLeaseDetails(leaseId);
        setAmount(lease.rentAmount * 100); // Assuming rentAmount is in dollars, convert to cents
        setCurrency('usd'); // Assuming USD as default currency
      } catch (err) {
        console.error('Failed to fetch lease details:', err);
        setError('Failed to load payment information.');
      }
    };

    fetchLeaseDetails();
  }, [leaseId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || amount === null || currency === null) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      return;
    }

    try {
      const { clientSecret } = await apiService.createPaymentIntent(amount, currency);

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (stripeError) {
        setError(stripeError.message || 'An error occurred.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to process payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Rent Payment</h3>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Rent'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Payment successful!</p>}
    </form>
  );
};

export default PaymentForm;
