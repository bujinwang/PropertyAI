// Web polyfills for React Native components that don't have web implementations
import { View } from 'react-native';

// Polyfill for RNSScreenContentWrapper
if (typeof window !== 'undefined') {
  // We're in a web environment
  const { AppRegistry } = require('react-native-web');
  
  // Register a simple View component as RNSScreenContentWrapper
  AppRegistry.registerComponent('RNSScreenContentWrapper', () => View);
  
  // Also register other potentially missing react-native-screens components
  AppRegistry.registerComponent('RNSScreen', () => View);
  AppRegistry.registerComponent('RNSScreenContainer', () => View);
  AppRegistry.registerComponent('RNSScreenStack', () => View);
  AppRegistry.registerComponent('RNSScreenStackHeaderConfig', () => View);
  AppRegistry.registerComponent('RNSScreenStackHeaderSubview', () => View);
}