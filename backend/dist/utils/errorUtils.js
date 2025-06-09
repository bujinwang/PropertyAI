"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.ErrorWithStatus = void 0;
/**
 * Custom error class that includes HTTP status code
 */
class ErrorWithStatus extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        // This is necessary in TypeScript to maintain proper prototype chain
        Object.setPrototypeOf(this, ErrorWithStatus.prototype);
    }
}
exports.ErrorWithStatus = ErrorWithStatus;
/**
 * Custom validation error with field-specific errors
 */
class ValidationError extends ErrorWithStatus {
    constructor(message, errors = {}) {
        super(message, 400);
        this.errors = errors;
        // This is necessary in TypeScript to maintain proper prototype chain
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication error
 */
class AuthenticationError extends ErrorWithStatus {
    constructor(message = 'Authentication required') {
        super(message, 401);
        // This is necessary in TypeScript to maintain proper prototype chain
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization error
 */
class AuthorizationError extends ErrorWithStatus {
    constructor(message = 'Access denied') {
        super(message, 403);
        // This is necessary in TypeScript to maintain proper prototype chain
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Resource not found error
 */
class NotFoundError extends ErrorWithStatus {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        // This is necessary in TypeScript to maintain proper prototype chain
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict error (e.g., duplicate entry)
 */
class ConflictError extends ErrorWithStatus {
    constructor(message = 'Resource already exists') {
        super(message, 409);
        // This is necessary in TypeScript to maintain proper prototype chain
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
/**
 * Helper to format error response object
 */
const formatErrorResponse = (error) => {
    const statusCode = error.status || 500;
    const message = error.message || 'Internal server error';
    const response = {
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
exports.formatErrorResponse = formatErrorResponse;
exports.default = {
    ErrorWithStatus,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    formatErrorResponse: exports.formatErrorResponse
};
//# sourceMappingURL=errorUtils.js.map