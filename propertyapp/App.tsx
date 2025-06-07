import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { navigationRef } from '@/navigation/navigationUtils';
import { AppProviders } from '@/contexts';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <RootNavigator />
      </AppProviders>
    </SafeAreaProvider>
  );
} 