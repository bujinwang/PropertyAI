import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage key constants
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

/**
 * Checks if the current device supports SecureStore
 */
const isSecureStoreAvailable = async (): Promise<boolean> => {
  return Platform.OS !== 'web' && await SecureStore.isAvailableAsync();
};

/**
 * Securely saves a value
 * Uses SecureStore on supported platforms, falls back to AsyncStorage
 */
export const secureStore = async (key: string, value: string): Promise<void> => {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value);
    } else {
      // Fallback to AsyncStorage with a warning
      console.warn(
        'SecureStore is not available on this platform. Falling back to AsyncStorage, which is less secure.'
      );
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    throw error;
  }
};

/**
 * Securely retrieves a value
 * Uses SecureStore on supported platforms, falls back to AsyncStorage
 */
export const secureRetrieve = async (key: string): Promise<string | null> => {
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(key);
    } else {
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    throw error;
  }
};

/**
 * Securely removes a value
 * Uses SecureStore on supported platforms, falls back to AsyncStorage
 */
export const secureRemove = async (key: string): Promise<void> => {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    throw error;
  }
};

/**
 * Stores the authentication token securely
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  await secureStore(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Retrieves the authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  return await secureRetrieve(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Removes the authentication token
 */
export const removeAuthToken = async (): Promise<void> => {
  await secureRemove(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Stores the refresh token securely
 */
export const storeRefreshToken = async (token: string): Promise<void> => {
  await secureStore(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Retrieves the refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return await secureRetrieve(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Removes the refresh token
 */
export const removeRefreshToken = async (): Promise<void> => {
  await secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Stores user data securely (as JSON string)
 */
export const storeUserData = async <T extends Record<string, unknown>>(userData: T): Promise<void> => {
  await secureStore(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

/**
 * Retrieves and parses user data
 */
export const getUserData = async <T>(): Promise<T | null> => {
  const data = await secureRetrieve(STORAGE_KEYS.USER_DATA);
  return data ? JSON.parse(data) as T : null;
};

/**
 * Removes the stored user data
 */
export const removeUserData = async (): Promise<void> => {
  await secureRemove(STORAGE_KEYS.USER_DATA);
};

/**
 * Clears all authentication-related data
 */
export const clearAuthData = async (): Promise<void> => {
  await removeAuthToken();
  await removeRefreshToken();
  await removeUserData();
}; 