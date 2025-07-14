import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from './types';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import PropertyFormScreen from '../screens/PropertyFormScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import MaintenanceRequestFormScreen from '../screens/MaintenanceRequestFormScreen';
import MaintenanceRequestDetailScreen from '../screens/MaintenanceRequestDetailScreen';
import PropertyPhotosScreen from '../screens/PropertyPhotosScreen';
import PhotoManagementScreen from '../screens/PhotoManagementScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import MessagesScreen from '../screens/MessagesScreen';
import DataPrivacyComplianceScreen from '../screens/DataPrivacyComplianceScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import AIGuidedSetupWizardScreen from '../screens/AIGuidedSetupWizardScreen';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom tab navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main stack navigator
const AppNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      
      {/* Main app screens */}
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen name="PropertyForm" component={PropertyFormScreen} />
      <Stack.Screen name="MaintenanceRequestForm" component={MaintenanceRequestFormScreen} />
      <Stack.Screen name="MaintenanceRequestDetail" component={MaintenanceRequestDetailScreen} />
      <Stack.Screen name="PropertyPhotos" component={PropertyPhotosScreen} />
      <Stack.Screen name="PhotoManagement" component={PhotoManagementScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      
      {/* AI and privacy screens */}
      <Stack.Screen name="AIGuidedSetupWizard" component={AIGuidedSetupWizardScreen} />
      <Stack.Screen name="DataPrivacyCompliance" component={DataPrivacyComplianceScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator; 