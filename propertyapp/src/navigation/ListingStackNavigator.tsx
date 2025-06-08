import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ManageListingsScreen from '../screens/ManageListingsScreen';
import EditListingScreen from '../screens/EditListingScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const ListingStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ManageListings" component={ManageListingsScreen} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
    </Stack.Navigator>
  );
};

export default ListingStackNavigator;
