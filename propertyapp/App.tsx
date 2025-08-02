// Import web polyfills first to ensure compatibility
import './src/utils/webPolyfills';

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { RootNavigator } from '@/navigation/RootNavigator';
import { navigationRef } from '@/navigation/navigationUtils';
import { AppProviders } from '@/contexts';
enableScreens();

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