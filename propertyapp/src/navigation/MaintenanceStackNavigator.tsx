import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MaintenanceRequestsScreen from '../screens/MaintenanceRequestsScreen';
import MaintenanceRequestDetailsScreen from '../screens/MaintenanceRequestDetailsScreen';
import { MaintenanceStackParamList } from './types';

const Stack = createStackNavigator<MaintenanceStackParamList>();

const MaintenanceStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MaintenanceRequests" component={MaintenanceRequestsScreen} />
      <Stack.Screen name="MaintenanceRequestDetails" component={MaintenanceRequestDetailsScreen} />
    </Stack.Navigator>
  );
};

export default MaintenanceStackNavigator;