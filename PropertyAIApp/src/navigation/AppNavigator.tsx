import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import MfaScreen from '../screens/MfaScreen';
import TenantTabNavigator from './TenantTabNavigator';
import ManagerTabNavigator from './ManagerTabNavigator';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegistrationScreen} />
        <Stack.Screen name="MFA" component={MfaScreen} />
        <Stack.Screen name="Tenant" component={TenantTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Manager" component={ManagerTabNavigator} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
