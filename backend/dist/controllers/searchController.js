"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchController = exports.SearchController = void 0;
const searchService_1 = require("../services/searchService");
const client_1 = require("@prisma/client");
const errorUtils_1 = require("../utils/errorUtils");
/**
 * Controller for handling property and unit search endpoints
 */
class SearchController {
    /**
     * Search for properties with advanced filtering
     */
    async searchProperties(req, res) {
        try {
            // Get all query parameters
            const { query, propertyType, city, state, zipCode, minRent, maxRent, bedrooms, bathrooms, minSize, maxSize, isAvailable, availableFrom, amenities, latitude, longitude, radius, managerId, ownerId, isActive, sortField, sortOrder, page = '1', limit = '10' } = req.query;
            // Build search parameters
            const searchParams = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10)
            };
            // Add text search query if provided
            if (query) {
                searchParams.query = query;
            }
            // Add location filters if provided
            if (city)
                searchParams.city = city;
            if (state)
                searchParams.state = state;
            if (zipCode)
                searchParams.zipCode = zipCode;
            // Add property type if provided and valid
            if (propertyType && Object.values(client_1.PropertyType).includes(propertyType)) {
                searchParams.propertyType = propertyType;
            }
            // Add rent range if provided
            if (minRent)
                searchParams.minRent = parseFloat(minRent);
            if (maxRent)
                searchParams.maxRent = parseFloat(maxRent);
            // Add unit features if provided
            if (bedrooms)
                searchParams.bedrooms = parseInt(bedrooms, 10);
            if (bathrooms)
                searchParams.bathrooms = parseFloat(bathrooms);
            if (minSize)
                searchParams.minSize = parseFloat(minSize);
            if (maxSize)
                searchParams.maxSize = parseFloat(maxSize);
            // Add availability filters if provided
            if (isAvailable !== undefined) {
                searchParams.isAvailable = isAvailable === 'true';
            }
            if (availableFrom) {
                searchParams.availableFrom = new Date(availableFrom);
            }
            // Add amenities filter if provided
            if (amenities) {
                searchParams.amenities = Array.isArray(amenities)
                    ? amenities
                    : [amenities];
            }
            // Add geolocation search if all required parameters are provided
            if (latitude && longitude && radius) {
                searchParams.latitude = parseFloat(latitude);
                searchParams.longitude = parseFloat(longitude);
                searchParams.radius = parseFloat(radius);
            }
            // Add owner/manager filters if provided
            if (managerId)
                searchParams.managerId = managerId;
            if (ownerId)
                searchParams.ownerId = ownerId;
            if (isActive !== undefined) {
                searchParams.isActive = isActive === 'true';
            }
            // Add sorting if provided
            if (sortField)
                searchParams.sortField = sortField;
            if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
                searchParams.sortOrder = sortOrder;
            }
            // Execute search
            const results = await searchService_1.searchService.searchProperties(searchParams);
            return res.status(200).json({
                status: 'success',
                data: results
            });
        }
        catch (error) {
            console.error('Error searching properties:', error);
            const { statusCode, response } = (0, errorUtils_1.formatErrorResponse)(error);
            return res.status(statusCode).json(response);
        }
    }
    /**
     * Search for available units with advanced filtering
     */
    async searchAvailableUnits(req, res) {
        try {
            // Get all query parameters
            const { propertyId, bedrooms, bathrooms, minRent, maxRent, minSize, maxSize, availableFrom, sortField, sortOrder, page = '1', limit = '10' } = req.query;
            // Build search parameters
            const searchParams = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                isAvailable: true
            };
            // Add property ID filter if provided
            if (propertyId) {
                searchParams.propertyId = propertyId;
            }
            // Add unit features if provided
            if (bedrooms)
                searchParams.bedrooms = parseInt(bedrooms, 10);
            if (bathrooms)
                searchParams.bathrooms = parseFloat(bathrooms);
            if (minSize)
                searchParams.minSize = parseFloat(minSize);
            if (maxSize)
                searchParams.maxSize = parseFloat(maxSize);
            // Add rent range if provided
            if (minRent)
                searchParams.minRent = parseFloat(minRent);
            if (maxRent)
                searchParams.maxRent = parseFloat(maxRent);
            // Add available date if provided
            if (availableFrom) {
                searchParams.availableFrom = new Date(availableFrom);
            }
            // Add sorting if provided
            if (sortField)
                searchParams.sortField = sortField;
            if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
                searchParams.sortOrder = sortOrder;
            }
            // Execute search
            const results = await searchService_1.searchService.searchAvailableUnits(searchParams);
            return res.status(200).json({
                status: 'success',
                data: results
            });
        }
        catch (error) {
            console.error('Error searching available units:', error);
            const { statusCode, response } = (0, errorUtils_1.formatErrorResponse)(error);
            return res.status(statusCode).json(response);
        }
    }
    /**
     * Get property type enum values
     */
    getPropertyTypes(req, res) {
        return res.status(200).json({
            status: 'success',
            data: Object.values(client_1.PropertyType)
        });
    }
}
exports.SearchController = SearchController;
// Export singleton instance
exports.searchController = new SearchController();
//# sourceMappingURL=searchController.js.map