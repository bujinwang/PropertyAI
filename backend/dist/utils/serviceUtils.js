"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCommunicationError = exports.ServiceCommunication = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Utility class for handling inter-service communication in the microservices architecture
 */
class ServiceCommunication {
    /**
     * Make a call to another microservice
     * @param service The target service name
     * @param endpoint The endpoint to call
     * @param method HTTP method
     * @param data Optional data to send
     * @param headers Optional additional headers
     * @returns Promise with the response data
     */
    static async call(service, endpoint, method = 'GET', data, headers) {
        var _a;
        try {
            // Construct the URL for the target service
            const url = `${this.baseUrl}/${service}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
            // Set up request configuration
            const options = {
                method,
                url,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Service-Call': 'true',
                    ...headers
                },
            };
            // Add data for non-GET requests
            if (method !== 'GET' && data) {
                options.data = data;
            }
            // Add query params for GET requests
            if (method === 'GET' && data) {
                options.params = data;
            }
            // Make the request
            const response = await (0, axios_1.default)(options);
            return response.data;
        }
        catch (error) {
            // Add service context to the error
            if (error.response) {
                throw new Error(`Service communication error with ${service} service: ${error.response.status} - ${((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) || error.message}`);
            }
            throw new Error(`Failed to communicate with ${service} service: ${error.message}`);
        }
    }
    /**
     * Validate if a user exists and is active
     * @param userId The user ID to validate
     * @returns Promise with user information if valid
     */
    static async validateUser(userId) {
        return this.call('users', `/validate/${userId}`, 'GET');
    }
    /**
     * Validate if a property exists and is active
     * @param propertyId The property ID to validate
     * @returns Promise with property information if valid
     */
    static async validateProperty(propertyId) {
        return this.call('properties', `/validate/${propertyId}`, 'GET');
    }
    /**
     * Get basic user information
     * @param userId The user ID
     * @returns Promise with basic user details
     */
    static async getUserBasicInfo(userId) {
        return this.call('users', `/basic/${userId}`, 'GET');
    }
    /**
     * Get basic property information
     * @param propertyId The property ID
     * @returns Promise with basic property details
     */
    static async getPropertyBasicInfo(propertyId) {
        return this.call('properties', `/basic/${propertyId}`, 'GET');
    }
}
exports.ServiceCommunication = ServiceCommunication;
ServiceCommunication.baseUrl = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL
    : 'http://localhost:5000/api';
/**
 * Error class for service communication failures
 */
class ServiceCommunicationError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ServiceCommunicationError';
        this.statusCode = statusCode;
    }
}
exports.ServiceCommunicationError = ServiceCommunicationError;
exports.default = ServiceCommunication;
//# sourceMappingURL=serviceUtils.js.map