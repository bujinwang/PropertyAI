import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LeaseScreen from '../screens/LeaseScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MfaScreen from '../screens/MfaScreen';
import PaymentPortalScreen from '../screens/PaymentPortalScreen';
import PaymentConfirmationScreen from '../screens/PaymentConfirmationScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import DocumentListScreen from '../screens/DocumentListScreen';
import DocumentDetailScreen from '../screens/DocumentDetailScreen';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegistrationScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Lease" component={LeaseScreen} />
        <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
        <Stack.Screen name="PaymentPortal" component={PaymentPortalScreen} />
        <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
        <Stack.Screen name="Documents" component={DocumentListScreen} />
        <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="MFA" component={MfaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
