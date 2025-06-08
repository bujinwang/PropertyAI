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
 * Store the authentication token securely
 * @param token JWT auth token
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
};

/**
 * Retrieve the stored authentication token
 * @returns The stored JWT token or null if not found
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    return token;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
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
 * Store user data securely
 * @param userData User data object to store
 */
export const storeUserData = async (userData: Record<string, unknown>): Promise<void> => {
  try {
    const userDataString = JSON.stringify(userData);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, userDataString);
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Retrieve stored user data
 * @returns Parsed user data object or null if not found
 */
export const getUserData = async <T>(): Promise<T | null> => {
  try {
    const userDataString = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    
    if (!userDataString) {
      return null;
    }
    
    return JSON.parse(userDataString) as T;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Removes the stored user data
 */
export const removeUserData = async (): Promise<void> => {
  await secureRemove(STORAGE_KEYS.USER_DATA);
};

/**
 * Clear all authentication data from secure storage
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await removeAuthToken();
    await removeRefreshToken();
    await removeUserData();
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
}; 