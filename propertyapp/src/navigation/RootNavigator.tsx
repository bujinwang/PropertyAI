import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import linking from './linking';
import { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { navigationRef } from './navigationUtils';
import { useAuth } from '@/contexts';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import AIGuidedSetupWizardScreen from '@/screens/AIGuidedSetupWizardScreen';
import PublicListingScreen from '@/screens/PublicListingScreen';
import { MLInsightsScreen } from '@/screens/MLInsightsScreen';

import PropertyDetailScreen from '@/screens/PropertyDetailScreen';
import UnitDetailScreen from '@/screens/UnitDetailScreen';
import ChatDetailScreen from '@/screens/ChatDetailScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import MaintenanceRequestsScreen from '@/screens/MaintenanceRequestsScreen';
import { FinancialDashboardScreen } from '@/screens/FinancialDashboardScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  console.log('RootNavigator - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={isAuthenticated ? 'Main' : 'PublicListing'}
      >
        {isAuthenticated ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="AIGuidedSetupWizard"
              component={AIGuidedSetupWizardScreen}
            />
            <Stack.Screen
              name="PropertyDetail"
              component={PropertyDetailScreen}
              options={{ headerShown: true, title: 'Property Details' }}
            />
            <Stack.Screen
              name="UnitDetail"
              component={UnitDetailScreen}
              options={{ headerShown: true, title: 'Unit Details' }}
            />
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{ headerShown: true, title: 'Chat' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: true, title: 'Settings' }}
            />
            <Stack.Screen
              name="MLInsights"
              component={MLInsightsScreen}
              options={{ headerShown: false }}
            />
            {/* Cross-tab entry points. These routes exist so that
                navigation.navigate('Payments' | 'Maintenance' | 'Dashboard')
                resolves outside the bottom-tab tree (the tab bar only carries
                the names in MainTabParamList). Each points at the closest real
                screen that already exists in propertyapp. */}
            <Stack.Screen
              name="Dashboard"
              component={FinancialDashboardScreen}
              options={{ headerShown: true, title: 'Dashboard' }}
            />
            <Stack.Screen
              name="Maintenance"
              component={MaintenanceRequestsScreen}
              options={{ headerShown: true, title: 'Maintenance' }}
            />
            <Stack.Screen
              name="Payments"
              component={FinancialDashboardScreen}
              options={{ headerShown: true, title: 'Payments' }}
            />
          </>
        ) : (
          // Auth screens
          <>
            <Stack.Screen name="PublicListing" component={PublicListingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
