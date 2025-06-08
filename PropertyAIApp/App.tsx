/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';

const App: React.FC = () => {
  return (
    <StripeProvider
      publishableKey="pk_test_YOUR_STRIPE_PUBLISHABLE_KEY"
    >
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </StripeProvider>
  );
};

export default App;
