import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, AuthState, LoginRequest } from '../types';
import { apiService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: { user: User; token: string } }
  | { type: 'SET_UNAUTHENTICATED' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_UNAUTHENTICATED':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = await SecureStore.getItemAsync('authToken');
      const userStr = await SecureStore.getItemAsync('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // Verify user has vendor role
        if (user.role === 'VENDOR' && user.vendor) {
          dispatch({ type: 'SET_AUTHENTICATED', payload: { user, token } });
        } else {
          // Not a vendor, clear stored data
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('user');
          dispatch({ type: 'SET_UNAUTHENTICATED' });
        }
      } else {
        dispatch({ type: 'SET_UNAUTHENTICATED' });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    }
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.login(credentials);
      
      if (response.data && response.data.user && response.data.token) {
        const { user, token } = response.data;
        
        // Verify user has vendor role
        if (user.role === 'VENDOR' && user.vendor) {
          // Store auth data securely
          await SecureStore.setItemAsync('authToken', token);
          await SecureStore.setItemAsync('user', JSON.stringify(user));
          
          dispatch({ type: 'SET_AUTHENTICATED', payload: { user, token } });
          return true;
        } else {
          // User is not a vendor
          dispatch({ type: 'SET_UNAUTHENTICATED' });
          return false;
        }
      } else {
        dispatch({ type: 'SET_UNAUTHENTICATED' });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuthState,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
