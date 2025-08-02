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

  // Fix for passive event listener warning (only in web environment)
  // Override addEventListener to make wheel events passive by default
  if (typeof EventTarget !== 'undefined' && EventTarget.prototype && EventTarget.prototype.addEventListener) {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'wheel' || type === 'mousewheel' || type === 'touchmove') {
        if (typeof options === 'boolean') {
          options = { capture: options, passive: true };
        } else if (typeof options === 'object' && options !== null) {
          options = { ...options, passive: true };
        } else {
          options = { passive: true };
        }
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }
}