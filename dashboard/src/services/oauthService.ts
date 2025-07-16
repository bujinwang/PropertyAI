import axios from 'axios';
import { CredentialResponse } from '@react-oauth/google';
import api from './api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

interface OAuthLoginResponse {
  token: string; // Session token from backend
  user: {
    id: string;
    email: string;
    name?: string;
    // Add other user properties as needed
  };
}

interface BackendOAuthPayload {
  provider: 'google' | 'facebook';
  token?: string; // For access_token from useGoogleLogin or Facebook
  idToken?: string; // For ID token (credential) from GoogleLogin
}

interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

interface OAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

/**
 * Handles the OAuth login process by sending the token to the backend
 * for validation and session creation.
 *
 * @param provider - The OAuth provider ('google' | 'facebook').
 * @param response - The credential response from Google (contains ID token).
 * @returns Promise resolving to user data and session token, or null on failure.
 */
export const handleOAuthLogin = async (
  provider: 'google' | 'facebook',
  response: CredentialResponse
): Promise<AuthResult | null> => {
  try {
    // Send the token to our backend for verification
    const result = await api.post<OAuthResponse>('/auth/oauth', {
      provider,
      credential: response.credential,
    });

    if (result.data && result.data.token) {
      return {
        user: result.data.user,
        token: result.data.token
      };
    }
    
    return null;
  } catch (error) {
    console.error(`${provider} OAuth login failed:`, error);
    return null;
  }
};

/**
 * Retrieves the stored session token.
 * @returns The session token or null if not found.
 */
export const getSessionToken = (): string | null => {
  return localStorage.getItem('sessionToken');
};

/**
 * Retrieves the stored user information.
 * @returns The user object or null if not found.
 */
export const getStoredUser = (): OAuthLoginResponse['user'] | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing stored user data:', e);
      localStorage.removeItem('user'); // Clear corrupted data
      return null;
    }
  }
  return null;
};

/**
 * Clears the session token and user information from local storage.
 */
export const logout = async (): Promise<void> => {
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
  // Update global application state to reflect logout
  // Assuming Redux store
import { store } from '../store';
  store.dispatch({ type: 'AUTH_LOGOUT' });
  // Call backend logout endpoint if necessary
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Backend logout failed:', error);
  }
  console.log('User logged out');
};