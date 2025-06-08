import axios from 'axios';
import { API_URL } from '../constants/api';
import { User } from '../types/user';

interface LoginResponse {
  token?: string;
  user?: User;
  requireMFA?: boolean;
  email?: string;
  message?: string;
}

interface MFAVerificationResponse {
  token: string;
  user: User;
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

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('Network error. Please try again.');
  }
};

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
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Registration failed');
    }
    throw new Error('Network error. Please try again.');
  }
};

export const verifyMFACode = async (email: string, code: string): Promise<MFAVerificationResponse> => {
  try {
    const response = await axios.post(`${API_URL}/mfa/verify`, {
      email,
      code
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'MFA verification failed');
    }
    throw new Error('Network error. Please try again.');
  }
};

export const getUserProfile = async (token: string): Promise<User> => {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to get profile');
    }
    throw new Error('Network error. Please try again.');
  }
};

export const setupMFA = async (token: string): Promise<{ secret: string; email: string }> => {
  try {
    const response = await axios.post(
      `${API_URL}/mfa/setup`,
      {},
      {
        headers: {
          'x-auth-token': token
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to set up MFA');
    }
    throw new Error('Network error. Please try again.');
  }
};

export const enableMFA = async (token: string, code: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post(
      `${API_URL}/mfa/enable`,
      { code },
      {
        headers: {
          'x-auth-token': token
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to enable MFA');
    }
    throw new Error('Network error. Please try again.');
  }
};

export const disableMFA = async (token: string, code: string): Promise<{ message: string }> => {
  try {
    const response = await axios.post(
      `${API_URL}/mfa/disable`,
      { code },
      {
        headers: {
          'x-auth-token': token
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to disable MFA');
    }
    throw new Error('Network error. Please try again.');
  }
};

export const getMFAStatus = async (token: string): Promise<{ mfaEnabled: boolean }> => {
  try {
    const response = await axios.get(`${API_URL}/mfa/status`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to get MFA status');
    }
    throw new Error('Network error. Please try again.');
  }
};

export const loginWithOAuth = async (provider: OAuthProvider): Promise<OAuthLoginResponse> => {
  try {
    // First, get the OAuth URL from backend
    const response = await axios.get(`${API_URL}/auth/oauth/${provider}`);
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || `Failed to login with ${provider}`);
    }
    throw new Error('Network error. Please try again.');
  }
};

export const handleOAuthCallback = async (provider: OAuthProvider, code: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/oauth/${provider}/callback`, { code });
    
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || `Failed to complete ${provider} login`);
    }
    throw new Error('Network error. Please try again.');
  }
}; 