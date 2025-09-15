import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper,
} from '@mui/material';
import { CreditCard, Security, CheckCircle } from '@mui/icons-material';

// Initialize Stripe (this should be done once and reused)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentSetupProps {
  onSuccess?: (paymentMethod: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface PaymentMethodFormProps {
  onSuccess: (paymentMethod: any) => void;
  onError: (error: string) => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card details');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: billingDetails.address,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'An error occurred while processing your card');
        onError(stripeError.message || 'Payment method creation failed');
        return;
      }

      // Call the API to save the payment method
      const response = await fetch('/api/payments/setup-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          setAsDefault: false, // User can choose this later
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save payment method');
      }

      onSuccess(data.paymentMethod);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={billingDetails.name}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={billingDetails.email}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={billingDetails.phone}
            onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            id="address"
            type="text"
            required
            value={billingDetails.address.line1}
            onChange={(e) => setBillingDetails(prev => ({
              ...prev,
              address: { ...prev.address, line1: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              id="city"
              type="text"
              required
              value={billingDetails.address.city}
              onChange={(e) => setBillingDetails(prev => ({
                ...prev,
                address: { ...prev.address, city: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="New York"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              id="state"
              type="text"
              required
              value={billingDetails.address.state}
              onChange={(e) => setBillingDetails(prev => ({
                ...prev,
                address: { ...prev.address, state: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="NY"
            />
          </div>

          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              id="zip"
              type="text"
              required
              value={billingDetails.address.postal_code}
              onChange={(e) => setBillingDetails(prev => ({
                ...prev,
                address: { ...prev.address, postal_code: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10001"
            />
          </div>
        </div>
      </div>

      {/* Card Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details *
          </label>
          <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Security Notice */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Security sx={{ mr: 1 }} />
        Your payment information is encrypted and processed securely by Stripe.
        We never store your card details on our servers.
      </Alert>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !cardComplete || isLoading}
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 3, py: 1.5 }}
        startIcon={isLoading ? <CircularProgress size={20} /> : <CreditCard />}
      >
        {isLoading ? 'Processing...' : 'Add Payment Method'}
      </Button>
    </form>
  );
};

const PaymentSetup: React.FC<PaymentSetupProps> = ({
  onSuccess,
  onError,
  onCancel,
  className = ''
}) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (paymentMethod: any) => {
    setSuccess(true);
    setError(null);
    onSuccess?.(paymentMethod);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(false);
    onError?.(errorMessage);
  };

  const options: StripeElementsOptions = {
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css?family=Inter:400,500,600',
      },
    ],
  };

  if (success) {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto' }}>
        <CardContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="success.main">
              Payment Method Added Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your payment method has been securely saved and is ready to use.
            </Typography>
            <Button
              onClick={() => {
                setSuccess(false);
                setError(null);
              }}
              variant="outlined"
              fullWidth
            >
              Add Another Payment Method
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CreditCard sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Add Payment Method</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Securely add a payment method for rent payments and other property-related charges.
        </Typography>
      </Box>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <PaymentMethodForm
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </Elements>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentSetup;