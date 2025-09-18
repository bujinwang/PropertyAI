import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';

import { MainTabParamList } from '@/types';
import { RealtimeDashboard } from '@/components/RealtimeDashboard';
import { PropertiesScreen } from '@/screens/main/PropertiesScreen';
import { MaintenanceScreen } from '@/screens/main/MaintenanceScreen';
import { PaymentsScreen } from '@/screens/main/PaymentsScreen';
import { ProfileScreen } from '@/screens/main/ProfileScreen';
import { usePushNotifications } from '@/services/pushNotificationService';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  const theme = useTheme();
  const { unreadCount } = usePushNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={RealtimeDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="view-dashboard" color={color} size={size} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.error,
            color: theme.colors.onError,
          },
        }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertiesScreen}
        options={{
          tabBarLabel: 'Properties',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Maintenance"
        component={MaintenanceScreen}
        options={{
          tabBarLabel: 'Maintenance',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="wrench" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="credit-card" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component - in a real app, you'd use react-native-vector-icons or similar
function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  // This is a placeholder - you'd implement actual icon rendering here
  return null;
}
