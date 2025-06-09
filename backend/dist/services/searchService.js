"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.SearchService = void 0;
const database_1 = require("../config/database");
const dbUtils_1 = require("../utils/dbUtils");
/**
 * Search service for advanced property and unit search capabilities
 */
class SearchService {
    /**
     * Search for properties with advanced filtering and full-text search
     */
    async searchProperties(params) {
        try {
            const { query, propertyType, city, state, zipCode, minRent, maxRent, bedrooms, bathrooms, minSize, maxSize, isAvailable, availableFrom, amenities, latitude, longitude, radius, managerId, ownerId, isActive, sortField = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = params;
            // Build the base where clause
            let where = {
                isActive: isActive !== undefined ? isActive : true
            };
            // Basic property filters
            if (propertyType) {
                where.propertyType = propertyType;
            }
            if (city) {
                where.city = { contains: city, mode: 'insensitive' };
            }
            if (state) {
                where.state = { contains: state, mode: 'insensitive' };
            }
            if (zipCode) {
                where.zipCode = { contains: zipCode };
            }
            if (managerId) {
                where.managerId = managerId;
            }
            if (ownerId) {
                where.ownerId = ownerId;
            }
            // Full-text search across multiple fields
            if (query) {
                where.OR = [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { address: { contains: query, mode: 'insensitive' } },
                    { city: { contains: query, mode: 'insensitive' } }
                ];
            }
            // Amenities filter (JSON field search)
            if (amenities && amenities.length > 0) {
                // We'll need to filter this in JavaScript after fetching the data
                // as JSON filtering is complex and varies by database
            }
            // Unit-related filters (these will be applied separately in unit filtering)
            const unitFilters = {};
            if (isAvailable !== undefined) {
                unitFilters.isAvailable = isAvailable;
            }
            if (availableFrom) {
                unitFilters.dateAvailable = { lte: new Date(availableFrom) };
            }
            if (bedrooms !== undefined) {
                unitFilters.bedrooms = { gte: bedrooms };
            }
            if (bathrooms !== undefined) {
                unitFilters.bathrooms = { gte: bathrooms };
            }
            if (minSize !== undefined) {
                unitFilters.size = { ...(unitFilters.size || {}), gte: minSize };
            }
            if (maxSize !== undefined) {
                unitFilters.size = { ...(unitFilters.size || {}), lte: maxSize };
            }
            if (minRent !== undefined) {
                unitFilters.rent = { ...(unitFilters.rent || {}), gte: minRent };
            }
            if (maxRent !== undefined) {
                unitFilters.rent = { ...(unitFilters.rent || {}), lte: maxRent };
            }
            // Check if we have unit filters
            const hasUnitFilters = Object.keys(unitFilters).length > 0;
            // If we have unit filters, we need to filter properties that have at least one unit matching
            if (hasUnitFilters) {
                where.units = {
                    some: unitFilters
                };
            }
            // Geolocation proximity search
            if (latitude !== undefined && longitude !== undefined && radius !== undefined) {
                // For PostgreSQL, we'd use PostGIS extension and the ST_DWithin function
                // Since this requires a custom setup, we'll simulate by filtering in application code
                // In a real app, you'd set up PostGIS and use a raw query here
                // For demonstration, we'll fetch properties with coordinates and filter later
                where.latitude = { not: null };
                where.longitude = { not: null };
            }
            // Get pagination parameters
            const { skip, take } = (0, dbUtils_1.getPaginationParams)(page, limit);
            // Build sort parameters
            const orderBy = (0, dbUtils_1.buildSortParams)(sortField, sortOrder);
            // Execute count and query in parallel
            const [totalCount, properties] = await Promise.all([
                // Count query
                database_1.prisma.property.count({ where }),
                // Main query
                database_1.prisma.property.findMany({
                    where,
                    skip,
                    take,
                    orderBy,
                    include: {
                        manager: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        units: {
                            where: hasUnitFilters ? unitFilters : undefined,
                            select: {
                                id: true,
                                unitNumber: true,
                                bedrooms: true,
                                bathrooms: true,
                                size: true,
                                rent: true,
                                isAvailable: true,
                                dateAvailable: true,
                                features: true
                            }
                        },
                        images: {
                            where: {
                                isFeatured: true
                            },
                            take: 1
                        }
                    }
                })
            ]);
            // Apply geospatial filtering if needed
            let filteredProperties = properties;
            let filteredCount = totalCount;
            if (latitude !== undefined && longitude !== undefined && radius !== undefined) {
                filteredProperties = properties.filter(property => {
                    if (!property.latitude || !property.longitude)
                        return false;
                    // Calculate distance in miles using Haversine formula
                    const distance = calculateDistance(latitude, longitude, property.latitude, property.longitude);
                    // Add distance property to each property for sorting
                    property.distance = distance;
                    // Filter by radius
                    return distance <= radius;
                });
                // If sorting by distance, sort the filtered properties
                if (sortField === 'distance') {
                    filteredProperties.sort((a, b) => {
                        const distA = a.distance || 0;
                        const distB = b.distance || 0;
                        return sortOrder === 'asc' ? distA - distB : distB - distA;
                    });
                }
                // Adjust count for the filtered results
                filteredCount = filteredProperties.length;
            }
            // Apply amenities filtering if needed
            if (amenities && amenities.length > 0) {
                filteredProperties = filteredProperties.filter(property => {
                    if (!property.amenities)
                        return false;
                    // Parse amenities if it's a string
                    const propertyAmenities = typeof property.amenities === 'string'
                        ? JSON.parse(property.amenities)
                        : property.amenities;
                    // Check if all required amenities are included
                    return amenities.every(amenity => propertyAmenities.includes(amenity));
                });
                // Adjust count for the filtered results
                filteredCount = filteredProperties.length;
            }
            // Calculate pagination
            const totalPages = Math.ceil(filteredCount / limit);
            return {
                properties: filteredProperties,
                total: filteredCount,
                page,
                limit,
                totalPages
            };
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Search for available units with advanced filtering
     */
    async searchAvailableUnits(params) {
        try {
            const { bedrooms, bathrooms, minRent, maxRent, minSize, maxSize, availableFrom, propertyId, sortField = 'rent', sortOrder = 'asc', page = 1, limit = 10 } = params;
            // Build the base where clause
            let where = {
                isAvailable: true
            };
            // Add property ID filter if provided
            if (propertyId) {
                where.propertyId = propertyId;
            }
            // Add available date filter
            if (availableFrom) {
                where.dateAvailable = { lte: new Date(availableFrom) };
            }
            // Add bedroom filter
            if (bedrooms !== undefined) {
                where.bedrooms = { gte: bedrooms };
            }
            // Add bathroom filter
            if (bathrooms !== undefined) {
                where.bathrooms = { gte: bathrooms };
            }
            // Add size filters
            if (minSize !== undefined) {
                where.size = { ...(where.size || {}), gte: minSize };
            }
            if (maxSize !== undefined) {
                where.size = { ...(where.size || {}), lte: maxSize };
            }
            // Add rent filters
            if (minRent !== undefined) {
                where.rent = { ...(where.rent || {}), gte: minRent };
            }
            if (maxRent !== undefined) {
                where.rent = { ...(where.rent || {}), lte: maxRent };
            }
            // Get pagination parameters
            const { skip, take } = (0, dbUtils_1.getPaginationParams)(page, limit);
            // Build sort parameters
            const orderBy = (0, dbUtils_1.buildSortParams)(sortField, sortOrder);
            // Execute count and query in parallel
            const [count, units] = await Promise.all([
                // Count query
                database_1.prisma.unit.count({ where }),
                // Main query
                database_1.prisma.unit.findMany({
                    where,
                    skip,
                    take,
                    orderBy,
                    include: {
                        property: {
                            select: {
                                id: true,
                                name: true,
                                address: true,
                                city: true,
                                state: true,
                                zipCode: true,
                                propertyType: true
                            }
                        },
                        images: {
                            where: {
                                isFeatured: true
                            },
                            take: 1
                        }
                    }
                })
            ]);
            // Calculate pagination
            const totalPages = Math.ceil(count / limit);
            return {
                units,
                total: count,
                page,
                limit,
                totalPages
            };
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
}
exports.SearchService = SearchService;
/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
// Export singleton instance
exports.searchService = new SearchService();
//# sourceMappingURL=searchService.js.map