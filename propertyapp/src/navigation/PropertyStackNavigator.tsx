import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { PropertyFormScreen } from '@/screens/PropertyFormScreen';

// Define stack param list with proper types
type PropertyStackParamList = {
  PropertyList: undefined;
  PropertyForm: { propertyId?: string };
};

// Import placeholder/future screens
const PropertyListScreen = () => <PropertyFormScreen />;

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
        component={PropertyListScreen}
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