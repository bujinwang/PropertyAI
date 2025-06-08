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

// Placeholder screens
const PropertiesScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Properties Screen</Text>
  </View>
);

const MessagesScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Messages Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Profile Screen</Text>
  </View>
);

// Admin-only screens
const AdminDashboardScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Admin Dashboard</Text>
    <Text>Only administrators can see this screen</Text>
  </View>
);

// Wrap component with role protection
const ProtectedAdminDashboard = () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboardScreen />
  </ProtectedRoute>
);

// Property manager screens
const PropertyManagerDashboardScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Property Manager Dashboard</Text>
    <Text>Property managers and admins can see this screen</Text>
  </View>
);

// Wrap component with role protection
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
        }}
      />
      
      <Tab.Screen 
        name="Properties" 
        component={PropertiesScreen} 
        options={{
          tabBarLabel: 'Properties',
        }}
      />
      
      {/* Show Messages tab to all users */}
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen} 
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      
      {/* Show PropertyManager tab only to property managers and admins */}
      {(userRole === 'propertyManager' || userRole === 'admin') && (
        <Tab.Screen 
          name="ManageListings"
          component={ListingStackNavigator}
          options={{
            tabBarLabel: 'Manage Listings',
            headerShown: false,
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
          }}
        />
      )}
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
