import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen } from '@/screens/HomeScreen';
import { Text, View } from 'react-native';
import { useAuth } from '@/contexts';
import { UserRole } from '@/types/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ListingStackNavigator from './ListingStackNavigator';
import MaintenanceStackNavigator from './MaintenanceStackNavigator';
import PropertyStackNavigator from './PropertyStackNavigator';
import { Ionicons } from '@expo/vector-icons';

import MessagesScreen from '@/screens/MessagesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import AdminDashboardScreen from '@/screens/AdminDashboardScreen';
import PropertyManagerDashboardScreen from '@/screens/PropertyManagerDashboardScreen';

// Wrap components with role protection
const ProtectedAdminDashboard = () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboardScreen />
  </ProtectedRoute>
);

const ProtectedPropertyManagerDashboard = () => (
  <ProtectedRoute allowedRoles={['propertyManager', 'admin']}>
    <PropertyManagerDashboardScreen />
  </ProtectedRoute>
);

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999999',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Properties" 
        component={PropertyStackNavigator} 
        options={{
          tabBarLabel: 'Properties',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Show Messages tab to all users */}
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen} 
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Show PropertyManager tab only to property managers and admins */}
      {(userRole === 'propertyManager' || userRole === 'admin') && (
        <Tab.Screen 
          name="ManageListings"
          component={ListingStackNavigator}
          options={{
            tabBarLabel: 'Listings',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Show Maintenance tab only to property managers and admins */}
      {(userRole === 'propertyManager' || userRole === 'admin') && (
        <Tab.Screen
          name="Maintenance"
          component={MaintenanceStackNavigator}
          options={{
            tabBarLabel: 'Maintenance',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="construct-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      
      {/* Show Admin tab only to admins */}
      {userRole === 'admin' && (
        <Tab.Screen
          name="Admin"
          component={ProtectedAdminDashboard}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
