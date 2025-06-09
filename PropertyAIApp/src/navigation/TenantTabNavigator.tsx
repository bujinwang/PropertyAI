import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import LeaseScreen from '../screens/LeaseScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentPortalScreen from '../screens/PaymentPortalScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import CommunityScreen from '../screens/CommunityScreen';

const Tab = createBottomTabNavigator();

const TenantTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Lease" component={LeaseScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
      <Tab.Screen name="Payments" component={PaymentPortalScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
};

export default TenantTabNavigator;
