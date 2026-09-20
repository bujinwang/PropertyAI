/**
 * Global Jest setup for the ContractorApp test suite.
 *
 * `jest-expo` already provides mocks for most Expo native modules. The mocks
 * below make the few modules that are executed at import time (and therefore
 * can crash a smoke test) behave predictably, without requiring a device.
 */

// `expo-notifications` runs `setNotificationHandler` at import time in
// `src/services/notifications.ts`. Ensure every API used by the service is a
// jest mock function that resolves instead of hitting the native layer.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-expo-push-token' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  dismissAllNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5 },
}));

// `expo-device` is read synchronously by the notification service.
jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'Jest',
}));

// `@expo/vector-icons` pulls in `expo-font`'s native module (`ExpoFontUtils`),
// which is unavailable in the Jest environment. Replace the icon sets with tiny
// text-rendering stand-ins so components that render icons can still mount.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const createIconSet = () => {
    const Icon = (props) => React.createElement(Text, props, props && props.name ? props.name : null);
    Icon.glyphMap = {};
    Icon.getImageSource = () => Promise.resolve({});
    Icon.loadFont = () => Promise.resolve();
    return Icon;
  };

  const iconSetNames = [
    'Ionicons',
    'MaterialIcons',
    'MaterialCommunityIcons',
    'AntDesign',
    'Entypo',
    'EvilIcons',
    'Feather',
    'FontAwesome',
    'FontAwesome5',
    'FontAwesome6',
    'Fontisto',
    'Foundation',
    'Octicons',
    'SimpleLineIcons',
    'Zocial',
  ];

  const iconSets = {};
  iconSetNames.forEach((name) => {
    iconSets[name] = createIconSet();
  });

  return iconSets;
});

// `react-native-paper` resolves its default icon set via the
// `@expo/vector-icons/MaterialCommunityIcons` subpath (default export).
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MaterialCommunityIcons = (props) =>
    React.createElement(Text, props, props && props.name ? props.name : null);
  MaterialCommunityIcons.glyphMap = {};

  return { __esModule: true, default: MaterialCommunityIcons };
});

// Secure storage used by AuthContext / api service. In-memory implementation so
// auth state flows resolve immediately and deterministically.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn((key) => Promise.resolve(store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

// React Native's Jest setup implements `requestAnimationFrame` as
// `setTimeout(() => cb(jest.now()), 0)`. Any frame still queued when a test
// finishes fires after Jest tears the environment down and throws
// "trying to access ... after it has been torn down". Replace it with a
// registry-backed implementation that uses the real clock and is flushed before
// the environment is destroyed.
const pendingAnimationFrames = new Set();

global.requestAnimationFrame = (callback) => {
  const id = setTimeout(() => {
    pendingAnimationFrames.delete(id);
    callback(Date.now());
  }, 0);
  pendingAnimationFrames.add(id);
  return id;
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
  pendingAnimationFrames.delete(id);
};

afterEach(() => {
  pendingAnimationFrames.forEach((id) => clearTimeout(id));
  pendingAnimationFrames.clear();
});

