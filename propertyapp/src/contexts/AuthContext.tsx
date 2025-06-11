import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { 
  clearAuthData, 
  getAuthToken, 
  getUserData, 
  storeAuthToken, 
  storeUserData 
} from '@/utils/secureStorage';
import { User, UserRole } from '@/types/auth';
import * as authService from '@/services/authService';
import { apiService } from '@/services/apiService';
import {
  hasPermission as checkPermission,
  hasMinimumRole as checkMinimumRole,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  hasResourcePermission as checkResourcePermission,
  hasResourceAccess as checkResourceAccess
} from '@/utils/rbac';
import { Permission, Resource, Action } from '@/types/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacySettings } from '../types/privacy';

// Interface for user settings
interface UserSettings {
  role?: string;
  portfolioSize?: string;
  communicationStyle?: 'formal' | 'casual';
  notificationPreferences?: Array<{
    id: string;
    type: string;
    channel: 'email' | 'push' | 'sms';
    frequency: 'immediate' | 'daily' | 'weekly';
    enabled: boolean;
  }>;
  suggestedFeatures?: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    priority: 'high' | 'medium' | 'low';
  }>;
  aiAutomationLevel?: 'minimal' | 'balanced' | 'full';
  privacy?: Partial<PrivacySettings>;
  [key: string]: unknown; // Allow other settings with unknown type
}

// Extend User type to include settings
interface ExtendedUser extends User {
  settings?: UserSettings;
}

// Authentication context type definition
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ExtendedUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userData: Partial<ExtendedUser>) => Promise<void>;
  updateUserSettings: (settings: Partial<{ privacy: Partial<PrivacySettings> }>) => Promise<void>;
  setUser: (user: ExtendedUser) => void;
  setToken: (token: string) => void;
  // MFA methods
  setupMFA: () => Promise<{ secret: string; email: string }>;
  enableMFA: (code: string) => Promise<void>;
  disableMFA: (code: string) => Promise<void>;
  verifyMFA: (email: string, code: string) => Promise<{ token: string; user: ExtendedUser }>;
  getMFAStatus: () => Promise<boolean>;
  // Permission methods
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
  hasResourcePermission: (resource: Resource, action: Action) => boolean;
  hasResourceAccess: (resource: Resource, resourceOwnerId?: string, isAssigned?: boolean) => boolean;
  checkRoleIs: (roles: UserRole[]) => boolean;
  updateUserProfile: (userData: Partial<ExtendedUser>) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  updateUserSettings: async () => {},
  setUser: () => {},
  setToken: () => {},
  setupMFA: async () => ({ secret: '', email: '' }),
  enableMFA: async () => {},
  disableMFA: async () => {},
  verifyMFA: async () => ({ token: '', user: {} as ExtendedUser }),
  getMFAStatus: async () => false,
  // Permission methods
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  hasMinimumRole: () => false,
  hasResourcePermission: () => false,
  hasResourceAccess: () => false,
  checkRoleIs: () => false,
  updateUserProfile: async () => {},
});

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await getAuthToken();
        const userData = await getUserData<User>();
        
        if (storedToken && userData) {
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Update secure storage when token or user changes
  useEffect(() => {
    const updateStorage = async () => {
      try {
        if (token && user) {
          await storeAuthToken(token);
          await storeUserData(user);
          setIsAuthenticated(true);
        } else if (!token && !user) {
          await clearAuthData();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error updating secure storage:', error);
      }
    };

    updateStorage();
  }, [token, user]);
  
  // Login function - this handles the standard email/password login
  // but we don't actually complete the login flow here if MFA is required
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await authService.login(email, password);
      
      // If MFA is required, we don't set the user or token yet
      if (response.requireMFA) {
        return;
      }
      
      // Standard login successful
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await authService.register(userData);
      
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear token in API service
      authService.clearAuthToken();
      
      // Clear local state
      setToken(null);
      setUser(null);
      
      // Clear secure storage is already handled by the useEffect
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use direct axios call since this doesn't require authentication
      await authService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password function
  const resetPassword = async (resetToken: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use direct axios call since this doesn't require authentication
      await authService.resetPassword(resetToken, newPassword);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update profile function
  const updateProfile = async (userData: Partial<ExtendedUser>): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use the apiService for authenticated requests
      const response = await apiService.put<User>('/auth/profile', userData);
      
      // Update local user data
      setUser((currentUser) => 
        currentUser ? { ...currentUser, ...response.data } : null
      );
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user settings function
  const updateUserSettings = async (settings: Partial<{ privacy: Partial<PrivacySettings> }>): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use the apiService for authenticated requests
      const response = await apiService.put<{ settings: UserSettings }>('/auth/settings', { settings });
      
      // Update local user data with new settings
      setUser((currentUser) => {
        if (!currentUser) return null;
        
        return {
          ...currentUser,
          settings: response.data.settings,
        };
      });
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Setup MFA function
  const setupMFA = async (): Promise<{ secret: string; email: string }> => {
    setIsLoading(true);
    
    try {
      // Use updated authService which uses apiService internally
      return await authService.setupMFA();
    } catch (error) {
      console.error('Setup MFA error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enable MFA function
  const enableMFA = async (code: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use updated authService which uses apiService internally
      await authService.enableMFA(code);
      
      // Update user data to reflect MFA status
      setUser((currentUser) => {
        if (!currentUser) return null;
        
        return {
          ...currentUser,
          mfaEnabled: true,
        };
      });
    } catch (error) {
      console.error('Enable MFA error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disable MFA function
  const disableMFA = async (code: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use updated authService which uses apiService internally
      await authService.disableMFA(code);
      
      // Update user data to reflect MFA status
      setUser((currentUser) => {
        if (!currentUser) return null;
        
        return {
          ...currentUser,
          mfaEnabled: false,
        };
      });
    } catch (error) {
      console.error('Disable MFA error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify MFA function
  const verifyMFA = async (email: string, code: string): Promise<{ token: string; user: ExtendedUser }> => {
    setIsLoading(true);
    
    try {
      const response = await authService.verifyMFACode(email, code);
      return response as { token: string; user: ExtendedUser };
    } catch (error) {
      console.error('Verify MFA error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get MFA status function
  const getMFAStatus = async (): Promise<boolean> => {
    try {
      // Use updated authService which uses apiService internally
      const response = await authService.getMFAStatus();
      return response.mfaEnabled;
    } catch (error) {
      console.error('Get MFA status error:', error);
      throw error;
    }
  };

  // Permission methods
  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(user?.role as UserRole, permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return checkAnyPermission(user?.role as UserRole, permissions);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return checkAllPermissions(user?.role as UserRole, permissions);
  };

  const hasMinimumRole = (minimumRole: UserRole): boolean => {
    return checkMinimumRole(user?.role as UserRole, minimumRole);
  };

  const hasResourcePermission = (resource: Resource, action: Action): boolean => {
    return checkResourcePermission(user?.role as UserRole, resource, action);
  };

  const hasResourceAccess = (resource: Resource, resourceOwnerId?: string, isAssigned?: boolean): boolean => {
    if (!user) return false;
    return checkResourceAccess(user.role as UserRole, resource, user.id, resourceOwnerId, isAssigned);
  };

  const checkRoleIs = (roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role as UserRole);
  };

  // Update user profile function
  const updateUserProfile = async (userData: Partial<ExtendedUser>): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use the apiService for authenticated requests
      const response = await apiService.put<User>('/auth/profile', userData);
      
      // Update local user data
      setUser((currentUser) => 
        currentUser ? { ...currentUser, ...response.data } : null
      );
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    token,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    updateUserSettings,
    setUser,
    setToken,
    setupMFA,
    enableMFA,
    disableMFA,
    verifyMFA,
    getMFAStatus,
    // Permission methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumRole,
    hasResourcePermission,
    hasResourceAccess,
    checkRoleIs,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 