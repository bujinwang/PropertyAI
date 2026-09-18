import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ManageListingsScreen from '../screens/ManageListingsScreen';
import EditListingScreen from '../screens/EditListingScreen';
import { ListingStackParamList } from './types';

const Stack = createStackNavigator<ListingStackParamList>();

const ListingStackNavigator = () => {
  return (
    <Stack.Navigator>
      {/* ManageListingsScreen is a shared screen: it is also mounted in
          PropertyStackNavigator under 'PropertyList'. Its props are typed
          against PropertyStackParamList, which is not assignable to this
          stack's screen props. The cast is confined to this registration. */}
      <Stack.Screen
        name="ManageListings"
        component={ManageListingsScreen as unknown as React.ComponentType<object>}
      />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
    </Stack.Navigator>
  );
};

export default ListingStackNavigator;
