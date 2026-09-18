import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Create a navigation ref that can be used outside of the React components
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a specific route.
 *
 * `params` is optional only for routes whose param type includes `undefined`
 * (e.g. `Settings: undefined`), mirroring React Navigation's own
 * conditionally-required params signature.
 */
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  ...args: undefined extends RootStackParamList[RouteName]
    ? [params?: RootStackParamList[RouteName]]
    : [params: RootStackParamList[RouteName]]
) {
  if (navigationRef.isReady()) {
    // navigate() is a dual-signature overloaded generic; unify it to the
    // (screen, params) form through `unknown` for this one forwarding call.
    // A double cast is required because the conditional tuple above and the
    // overload's own conditional type do not overlap structurally.
    const forward = navigationRef.navigate as unknown as (
      screen: RouteName,
      params?: RootStackParamList[RouteName]
    ) => void;
    forward(name, args[0]);
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