import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Create a navigation ref that can be used outside of the React components
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Navigate to a specific route
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    // You might want to save this navigation action and perform it when the navigator is ready
    console.warn('Navigation attempted before navigator was ready');
  }
}

// Go back to the previous screen
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

// Reset the navigation state
export function reset(name: keyof RootStackParamList, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name, params }],
    });
  }
} 