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
import { hasPermission, hasMinimumRole } from '@/utils/permissions';

// Authentication context type definition
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  // Role-based authorization methods
  hasRole: (role: UserRole) => boolean;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  hasMinimumRole: () => false,
});

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        const userData = await getUserData<User>();
        
        if (token && userData) {
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

  // Mock API calls (replace with real API in production)
  
  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This is for demonstration only - in production, use a real API
      if (email === 'demo@example.com' && password === 'Password123') {
        // Mock successful login
        const mockUser: User = {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'propertyManager',
        };
        
        // Save auth data
        await storeAuthToken('mock-jwt-token');
        await storeUserData(mockUser);
        
        setUser(mockUser);
        setIsAuthenticated(true);
      } else {
        // Mock login failure
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This is for demonstration only - in production, use a real API
      const mockUser: User = {
        id: '2',
        name,
        email,
        role,
      };
      
      // Save auth data
      await storeAuthToken('mock-jwt-token');
      await storeUserData(mockUser);
      
      setUser(mockUser);
      setIsAuthenticated(true);
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
      await clearAuthData();
      
      setUser(null);
      setIsAuthenticated(false);
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, implement actual password reset API call
      console.log(`Password reset requested for: ${email}`);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password function
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // In production, implement actual password reset verification API call
      console.log(`Password reset with token: ${token}, new password length: ${newPassword.length}`);
      
      // For demo purposes, we'll consider the reset successful
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
      if (!user) {
        throw new Error('No user is logged in');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update user data
      const updatedUser = { ...user, ...userData };
      
      // Save updated user data
      await storeUserData(updatedUser);
      
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Role-based authorization methods
  
  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };
  
  // Check if user has permission based on allowed roles
  const checkPermission = (allowedRoles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role, allowedRoles);
  };
  
  // Check if user has minimum role level
  const checkMinimumRole = (minimumRole: UserRole): boolean => {
    if (!user?.role) return false;
    return hasMinimumRole(user.role, minimumRole);
  };

  // Provide auth context
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    hasRole,
    hasPermission: checkPermission,
    hasMinimumRole: checkMinimumRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 