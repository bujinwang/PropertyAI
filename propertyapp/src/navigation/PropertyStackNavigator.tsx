import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { PropertyFormScreen } from '@/screens/PropertyFormScreen';
import ManageListingsScreen from '@/screens/ManageListingsScreen'; // Import the actual property list screen

// Define stack param list with proper types
export type PropertyStackParamList = { // Export the type
  PropertyList: undefined;
  PropertyForm: { propertyId?: string };
};

const Stack = createStackNavigator<PropertyStackParamList>();

const PropertyStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="PropertyList"
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: COLORS.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          color: COLORS.text.primary,
        },
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen
        name="PropertyList"
        component={ManageListingsScreen} // Use the actual ManageListingsScreen
        options={{ 
          title: 'My Properties',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="PropertyForm"
        component={PropertyFormScreen}
        options={({ route }) => ({
          title: route.params?.propertyId ? 'Edit Property' : 'Add Property',
        })}
      />
    </Stack.Navigator>
  );
};

export default PropertyStackNavigator;
