import { Alert } from 'react-native';

// Error types that we handle in the UI
export enum ErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

// Error interface matching our API errors
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

/**
 * Show a user-friendly error message for rate limit errors
 * @param error The error object from the API
 * @param resourceName Optional name of the resource being accessed (for more specific messages)
 */
export const handleRateLimitError = (error: unknown, resourceName?: string): void => {
  const apiError = error as ApiError;
  const resource = resourceName || 'this resource';
  
  if (apiError.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
    Alert.alert(
      'Too Many Requests',
      `You've made too many requests to ${resource} in a short period of time. Please wait a moment and try again.`,
      [{ text: 'OK', style: 'default' }]
    );
    return;
  }
  
  // Handle other error types
  handleApiError(apiError);
};

/**
 * General error handler for API errors
 * @param error The error object from the API
 */
export const handleApiError = (error: unknown): void => {
  const apiError = error as ApiError;
  
  // Format validation errors if present
  let validationMessages = 'Please check your input and try again.';
  if (apiError.code === ErrorCode.VALIDATION_FAILED && apiError.errors) {
    validationMessages = Object.entries(apiError.errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
  }
  
  switch (apiError.code) {
    case ErrorCode.AUTH_REQUIRED:
      Alert.alert(
        'Authentication Required',
        'Your session has expired. Please log in again.',
        [{ text: 'OK', style: 'default' }]
      );
      break;
    
    case ErrorCode.PERMISSION_DENIED:
      Alert.alert(
        'Access Denied',
        'You do not have permission to perform this action.',
        [{ text: 'OK', style: 'default' }]
      );
      break;
    
    case ErrorCode.VALIDATION_FAILED:
      Alert.alert(
        'Validation Error',
        validationMessages,
        [{ text: 'OK', style: 'default' }]
      );
      break;
    
    case ErrorCode.NETWORK_ERROR:
      Alert.alert(
        'Network Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      break;
      
    case ErrorCode.SERVER_ERROR:
      Alert.alert(
        'Server Error',
        'An unexpected error occurred on the server. Please try again later.',
        [{ text: 'OK', style: 'default' }]
      );
      break;
      
    default:
      // Default error message for unknown errors
      Alert.alert(
        'Error',
        apiError.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      break;
  }
};

/**
 * Check if an error is a rate limit error
 * @param error The error to check
 * @returns True if the error is a rate limit error
 */
export const isRateLimitError = (error: unknown): boolean => {
  const apiError = error as ApiError;
  return apiError.code === ErrorCode.RATE_LIMIT_EXCEEDED || apiError.status === 429;
};

/**
 * Exponential backoff implementation for retrying requests
 * @param retryCount Current retry attempt count
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Delay time in milliseconds
 */
export const calculateBackoff = (
  retryCount: number, 
  baseDelay: number = 1000, 
  maxDelay: number = 30000
): number => {
  // Calculate delay with exponential backoff and some randomness
  const delay = Math.min(
    maxDelay,
    baseDelay * Math.pow(2, retryCount) * (0.8 + Math.random() * 0.4)
  );
  
  return delay;
};

/**
 * Execute a function with retry capability and exponential backoff
 * @param fn The async function to execute
 * @param maxRetries Maximum number of retries
 * @param shouldRetry Function to determine if a retry should be attempted
 * @returns Promise resolving to the function result
 */
export const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  shouldRetry: (error: unknown) => boolean = isRateLimitError
): Promise<T> => {
  let retryCount = 0;
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry if we've reached max retries or if this error shouldn't be retried
      if (retryCount >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate backoff delay
      const delay = calculateBackoff(retryCount);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increment retry count
      retryCount++;
    }
  }
}; 