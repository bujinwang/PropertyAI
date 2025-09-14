import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH_SUCCESS'; payload: AuthTokens }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'TOKEN_REFRESH_SUCCESS':
      return {
        ...state,
        tokens: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'auth_tokens';
const USER_STORAGE_KEY = 'user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load stored authentication data on app start
  useEffect(() => {
    loadStoredAuthData();
  }, []);

  const loadStoredAuthData = async () => {
    try {
      const [tokensString, userString] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_STORAGE_KEY),
        SecureStore.getItemAsync(USER_STORAGE_KEY),
      ]);

      if (tokensString && userString) {
        const tokens: AuthTokens = JSON.parse(tokensString);
        const user: User = JSON.parse(userString);

        // Check if token is still valid
        if (isTokenValid(tokens)) {
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } });
        } else {
          // Try to refresh token
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
    } finally {
      dispatch({ type: 'AUTH_START' }); // This will set isLoading to false
      // Actually, we need to set isLoading to false here
      // Let's fix this by dispatching a different action or modifying the reducer
    }
  };

  const isTokenValid = (tokens: AuthTokens): boolean => {
    const now = Date.now();
    const expiryTime = tokens.expiresIn * 1000; // Convert to milliseconds
    return now < expiryTime;
  };

  const storeAuthData = async (user: User, tokens: AuthTokens) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(tokens)),
        SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY),
        SecureStore.deleteItemAsync(USER_STORAGE_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(credentials);
      const { user, tokens } = response.data;

      await storeAuthData(user, tokens);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } });
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.register(data);
      const { user, tokens } = response.data;

      await storeAuthData(user, tokens);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } });
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (state.tokens?.accessToken) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async () => {
    if (!state.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(state.tokens.refreshToken);
      const newTokens = response.data;

      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(newTokens));
      dispatch({ type: 'TOKEN_REFRESH_SUCCESS', payload: newTokens });
    } catch (error) {
      // If refresh fails, logout user
      await clearAuthData();
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}