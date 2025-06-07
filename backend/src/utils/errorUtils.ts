/**
 * Custom error class that includes HTTP status code
 */
export class ErrorWithStatus extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    
    // This is necessary in TypeScript to maintain proper prototype chain
    Object.setPrototypeOf(this, ErrorWithStatus.prototype);
  }
}

/**
 * Custom validation error with field-specific errors
 */
export class ValidationError extends ErrorWithStatus {
  errors: Record<string, string>;
  
  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, 400);
    this.errors = errors;
    
    // This is necessary in TypeScript to maintain proper prototype chain
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends ErrorWithStatus {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    
    // This is necessary in TypeScript to maintain proper prototype chain
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends ErrorWithStatus {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    
    // This is necessary in TypeScript to maintain proper prototype chain
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends ErrorWithStatus {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    
    // This is necessary in TypeScript to maintain proper prototype chain
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error (e.g., duplicate entry)
 */
export class ConflictError extends ErrorWithStatus {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
    
    // This is necessary in TypeScript to maintain proper prototype chain
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Helper to format error response object
 */
export const formatErrorResponse = (error: any) => {
  const statusCode = error.status || 500;
  const message = error.message || 'Internal server error';
  
  const response: {
    success: boolean;
    message: string;
    errors?: Record<string, string>;
    stack?: string;
  } = {
    success: false,
    message
  };
  
  // Add validation errors if present
  if (error instanceof ValidationError && error.errors) {
    response.errors = error.errors;
  }
  
  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }
  
  return { statusCode, response };
};

export default {
  ErrorWithStatus,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  formatErrorResponse
}; 