import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config/config';

/**
 * Utility class for handling inter-service communication in the microservices architecture
 */
export class ServiceCommunication {
  private static readonly baseUrl = process.env.NODE_ENV === 'production' 
    ? config.services.baseUrl 
    : 'http://localhost:5000/api';

  /**
   * Make a call to another microservice
   * @param service The target service name
   * @param endpoint The endpoint to call
   * @param method HTTP method
   * @param data Optional data to send
   * @param headers Optional additional headers
   * @returns Promise with the response data
   */
  static async call<T = any>(
    service: 'users' | 'properties' | 'auth' | 'maintenance' | 'financial',
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      // Construct the URL for the target service
      const url = `${this.baseUrl}/${service}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      // Set up request configuration
      const options: AxiosRequestConfig = {
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
      const response: AxiosResponse<T> = await axios(options);
      return response.data;
    } catch (error: any) {
      // Add service context to the error
      if (error.response) {
        throw new Error(`Service communication error with ${service} service: ${error.response.status} - ${error.response.data?.message || error.message}`);
      }
      throw new Error(`Failed to communicate with ${service} service: ${error.message}`);
    }
  }

  /**
   * Validate if a user exists and is active
   * @param userId The user ID to validate
   * @returns Promise with user information if valid
   */
  static async validateUser(userId: string): Promise<{ id: string; email: string; isActive: boolean }> {
    return this.call('users', `/validate/${userId}`, 'GET');
  }

  /**
   * Validate if a property exists and is active
   * @param propertyId The property ID to validate
   * @returns Promise with property information if valid
   */
  static async validateProperty(propertyId: string): Promise<{ id: string; name: string; isActive: boolean }> {
    return this.call('properties', `/validate/${propertyId}`, 'GET');
  }

  /**
   * Get basic user information
   * @param userId The user ID
   * @returns Promise with basic user details
   */
  static async getUserBasicInfo(userId: string): Promise<{ id: string; firstName: string; lastName: string; email: string; role: string }> {
    return this.call('users', `/basic/${userId}`, 'GET');
  }

  /**
   * Get basic property information
   * @param propertyId The property ID
   * @returns Promise with basic property details
   */
  static async getPropertyBasicInfo(propertyId: string): Promise<{ id: string; name: string; address: string; city: string; state: string }> {
    return this.call('properties', `/basic/${propertyId}`, 'GET');
  }
}

/**
 * Error class for service communication failures
 */
export class ServiceCommunicationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ServiceCommunicationError';
    this.statusCode = statusCode;
  }
}

export default ServiceCommunication; 