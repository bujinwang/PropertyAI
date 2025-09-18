import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import linking from './linking';
import { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { navigationRef } from './navigation/navigationUtils';
import { useAuth } from '@/contexts';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { LoadingScreen } from '@/screens/LoadingScreen'; // From mobile
import AIGuidedSetupWizardScreen from '@/screens/AIGuidedSetupWizardScreen';
import PublicListingScreen from '@/screens/PublicListingScreen';

import PropertyDetailScreen from '@/screens/PropertyDetailScreen';
import UnitDetailScreen from '@/screens/UnitDetailScreen';
import ChatDetailScreen from '@/screens/ChatDetailScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import DashboardScreen from '@/screens/main/DashboardScreen'; // From mobile if unique
import MaintenanceScreen from '@/screens/main/MaintenanceScreen'; // From mobile if unique
import PaymentsScreen from '@/screens/main/PaymentsScreen'; // From mobile if unique

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />; // Use mobile's LoadingScreen for consistency
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
            {/* Added from mobile */}
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ headerShown: true, title: 'Dashboard' }}
            />
            <Stack.Screen
              name="Maintenance"
              component={MaintenanceScreen}
              options={{ headerShown: true, title: 'Maintenance' }}
            />
            <Stack.Screen
              name="Payments"
              component={PaymentsScreen}
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
