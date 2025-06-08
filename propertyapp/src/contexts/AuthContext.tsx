import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { 
  clearAuthData, 
  getAuthToken, 
  getUserData, 
  storeAuthToken, 
  storeUserData 
} from '@/utils/secureStorage';
import { User } from '@/types/user';
import * as authService from '@/services/authService';

// Authentication context type definition
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
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
  updateProfile: (userData: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  // MFA methods
  setupMFA: () => Promise<{ secret: string; email: string }>;
  enableMFA: (code: string) => Promise<void>;
  disableMFA: (code: string) => Promise<void>;
  verifyMFA: (email: string, code: string) => Promise<{ token: string; user: User }>;
  getMFAStatus: () => Promise<boolean>;
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
  setUser: () => {},
  setToken: () => {},
  setupMFA: async () => ({ secret: '', email: '' }),
  enableMFA: async () => {},
  disableMFA: async () => {},
  verifyMFA: async () => ({ token: '', user: {} as User }),
  getMFAStatus: async () => false,
});

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
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
      // Clear auth data
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'An error occurred while logging out.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // TODO: Implement real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Password reset requested for: ${email}`);
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
      // TODO: Implement real API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      console.log(`Password reset with token: ${resetToken}, new password length: ${newPassword.length}`);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    setIsLoading(true);
    
    try {
      if (!user || !token) {
        throw new Error('No user is logged in');
      }
      
      // TODO: Implement real API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // MFA Setup function
  const setupMFA = async (): Promise<{ secret: string; email: string }> => {
    setIsLoading(true);
    
    try {
      if (!token) {
        throw new Error('No user is logged in');
      }
      
      const response = await authService.setupMFA(token);
      return response;
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enable MFA function
  const enableMFA = async (code: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      if (!token) {
        throw new Error('No user is logged in');
      }
      
      await authService.enableMFA(token, code);
      
      // Update user profile to reflect MFA status
      if (user) {
        setUser({ ...user, mfaEnabled: true });
      }
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
      if (!token) {
        throw new Error('No user is logged in');
      }
      
      await authService.disableMFA(token, code);
      
      // Update user profile to reflect MFA status
      if (user) {
        setUser({ ...user, mfaEnabled: false });
      }
    } catch (error) {
      console.error('Disable MFA error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify MFA function (used during login)
  const verifyMFA = async (email: string, code: string): Promise<{ token: string; user: User }> => {
    setIsLoading(true);
    
    try {
      const response = await authService.verifyMFACode(email, code);
      
      setToken(response.token);
      setUser(response.user);
      
      return response;
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
      if (!token) {
        return false;
      }
      
      const response = await authService.getMFAStatus(token);
      return response.mfaEnabled;
    } catch (error) {
      console.error('Get MFA status error:', error);
      return false;
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
    setUser,
    setToken,
    setupMFA,
    enableMFA,
    disableMFA,
    verifyMFA,
    getMFAStatus,
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