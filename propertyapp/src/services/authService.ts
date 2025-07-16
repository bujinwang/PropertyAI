import axios, { AxiosError } from 'axios';
import { API_URL } from '../constants/api';
import { User } from '../types/auth';
import { apiService } from './apiService';
import { MFAVerificationResponse } from '../types/auth';
import { storeRefreshToken } from '../utils/secureStorage';

// Define error types for better type safety
type ErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

interface LoginResponse {
  token?: string;
  user?: User;
  requireMFA?: boolean;
  email?: string;
  message?: string;
}

export type OAuthProvider = 'google' | 'facebook' | 'github' | 'microsoft';

interface OAuthLoginResponse {
  token?: string;
  user?: User;
  requireMFA?: boolean;
  email?: string;
  message?: string;
  url?: string; // URL to redirect for OAuth flow
}

// Login does not use apiService because the user is not yet authenticated
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    // Store both access and refresh tokens
    if (response.data.token) {
      apiService.setToken(response.data.token);
    }
    
    if (response.data.refreshToken) {
      await storeRefreshToken(response.data.refreshToken);
    }
    
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else if ('response' in err && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Login failed. Please try again.');
  }
};

// Register does not use apiService because the user is not yet authenticated
export const register = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}): Promise<{ token: string; user: User }> => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    
    // If registration is successful and we get a token, set it in the apiService
    if (response.data.token) {
      apiService.setToken(response.data.token);
    }
    
    if (response.data.refreshToken) {
      await storeRefreshToken(response.data.refreshToken);
    }
    
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else if ('response' in err && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Registration failed. Please try again.');
  }
};

// MFA verification does not use apiService because the user is not yet fully authenticated
export const verifyMFACode = async (email: string, code: string): Promise<MFAVerificationResponse> => {
  try {
    const response = await axios.post(`${API_URL}/mfa/verify`, {
      email,
      code
    });
    
    // If MFA verification is successful and we get a token, set it in the apiService
    if (response.data.token) {
      apiService.setToken(response.data.token);
    }
    
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else if ('response' in err && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('MFA verification failed. Please try again.');
  }
};

// All authenticated requests below use the apiService

export const getUserProfile = async (): Promise<User> => {
  try {
    const response = await apiService.get<User>('/auth/me');
    return response.data;
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || 'Failed to get profile');
  }
};

export const setupMFA = async (): Promise<{ secret: string; email: string }> => {
  try {
    const response = await apiService.post<{ secret: string; email: string }>('/mfa/setup');
    return response.data;
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || 'Failed to set up MFA');
  }
};

export const enableMFA = async (code: string): Promise<{ message: string }> => {
  try {
    const response = await apiService.post<{ message: string }>('/mfa/enable', { code });
    return response.data;
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || 'Failed to enable MFA');
  }
};

export const disableMFA = async (code: string): Promise<{ message: string }> => {
  try {
    const response = await apiService.post<{ message: string }>('/mfa/disable', { code });
    return response.data;
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || 'Failed to disable MFA');
  }
};

export const getMFAStatus = async (): Promise<{ mfaEnabled: boolean }> => {
  try {
    const response = await apiService.get<{ mfaEnabled: boolean }>('/mfa/status');
    return response.data;
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || 'Failed to get MFA status');
  }
};

// OAuth login and callback don't use apiService because the user is not yet authenticated
export const loginWithOAuth = async (provider: OAuthProvider): Promise<OAuthLoginResponse> => {
  try {
    const response = await axios.get(`${API_URL}/auth/oauth/${provider}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else if ('response' in err && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error(`Failed to login with ${provider}. Please try again.`);
  }
};

export const handleOAuthCallback = async (provider: OAuthProvider, code: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/oauth/${provider}/callback`, { code });
    
    // If OAuth callback is successful and we get a token, set it in the apiService
    if (response.data.token) {
      apiService.setToken(response.data.token);
    }
    
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else if ('response' in err && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error(`Failed to complete ${provider} login. Please try again.`);
  }
};

// Helper function to clear token on logout
export const clearAuthToken = (): void => {
  apiService.clearToken();
};

// Forgot password doesn't use apiService because it doesn't require authentication
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else if ('response' in err && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Failed to process password reset request. Please try again.');
  }
};

// Reset password doesn't use apiService because it uses a special token
export const resetPassword = async (resetToken: string, newPassword: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { 
      token: resetToken, 
      newPassword 
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message: string }> | ErrorWithResponse;
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    } else if ('response' in err && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Failed to reset password. Please try again.');
  }
};