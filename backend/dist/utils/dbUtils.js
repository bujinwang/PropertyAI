"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationMeta = exports.recordExists = exports.executeTransaction = exports.buildSortParams = exports.getPaginationParams = exports.handleDatabaseError = void 0;
const database_1 = require("../config/database");
/**
 * Generic function to handle database errors
 * @param error The error thrown by database operations
 * @returns A standardized error object
 */
const handleDatabaseError = (error) => {
    console.error('Database error:', error);
    // Check for Prisma known request errors by code property
    if (error.code) {
        // Handle known Prisma errors by code
        switch (error.code) {
            case 'P2002': // Unique constraint violation
                return {
                    message: 'A record with this data already exists.',
                    code: 'DUPLICATE_ENTRY',
                    status: 409,
                    details: error.meta
                };
            case 'P2025': // Record not found
                return {
                    message: 'The requested record was not found.',
                    code: 'NOT_FOUND',
                    status: 404,
                    details: error.meta
                };
            case 'P2003': // Foreign key constraint failed
                return {
                    message: 'The operation failed due to a relation constraint.',
                    code: 'FOREIGN_KEY_VIOLATION',
                    status: 400,
                    details: error.meta
                };
            case 'P2019': // Input error
                return {
                    message: 'The input data is invalid.',
                    code: 'INVALID_INPUT',
                    status: 400,
                    details: error.meta
                };
        }
    }
    // Default error response
    return {
        message: error.message || 'An unexpected database error occurred',
        code: error.code || 'INTERNAL_ERROR',
        status: error.status || 500
    };
};
exports.handleDatabaseError = handleDatabaseError;
/**
 * Get pagination parameters for database queries
 * @param page Page number (1-based)
 * @param limit Items per page
 * @returns Skip and take parameters for Prisma
 */
const getPaginationParams = (page = 1, limit = 10) => {
    const validPage = page < 1 ? 1 : page;
    const validLimit = limit < 1 ? 10 : (limit > 100 ? 100 : limit);
    return {
        skip: (validPage - 1) * validLimit,
        take: validLimit
    };
};
exports.getPaginationParams = getPaginationParams;
/**
 * Build sort parameters for Prisma queries
 * @param sortField Field to sort by
 * @param sortOrder Sort direction ('asc' or 'desc')
 * @returns OrderBy object for Prisma
 */
const buildSortParams = (sortField = 'createdAt', sortOrder = 'desc') => {
    // Ensure sortField is a valid string
    const field = sortField || 'createdAt';
    // Default to descending for most recent first
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    // Return OrderBy object in format Prisma expects
    return { [field]: order };
};
exports.buildSortParams = buildSortParams;
/**
 * Execute a database transaction
 * @param callback Function to execute within transaction
 * @returns Result of the callback
 */
const executeTransaction = async (callback) => {
    try {
        // Run callback in transaction
        const result = await database_1.prisma.$transaction(callback);
        return result;
    }
    catch (error) {
        throw (0, exports.handleDatabaseError)(error);
    }
};
exports.executeTransaction = executeTransaction;
/**
 * Check if a record exists in the database
 * @param model The Prisma model to query
 * @param where The filter condition
 * @returns Boolean indicating if the record exists
 */
const recordExists = async (model, where) => {
    try {
        const count = await model.count({
            where
        });
        return count > 0;
    }
    catch (error) {
        const standardError = (0, exports.handleDatabaseError)(error);
        throw standardError;
    }
};
exports.recordExists = recordExists;
/**
 * Create metadata for paginated responses
 * @param totalItems Total number of items in the database matching the query
 * @param pagination The pagination parameters used
 * @returns Pagination metadata
 */
const createPaginationMeta = (totalItems, pagination) => {
    const totalPages = Math.ceil(totalItems / pagination.limit);
    return {
        currentPage: pagination.page,
        itemsPerPage: pagination.limit,
        totalItems,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1
    };
};
exports.createPaginationMeta = createPaginationMeta;
//# sourceMappingURL=dbUtils.js.map