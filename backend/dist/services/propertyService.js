"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyService = exports.PropertyService = exports.PropertyType = void 0;
const database_1 = require("../config/database");
const dbUtils_1 = require("../utils/dbUtils");
// Enum for property types matching Prisma schema
var PropertyType;
(function (PropertyType) {
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["HOUSE"] = "HOUSE";
    PropertyType["CONDO"] = "CONDO";
    PropertyType["TOWNHOUSE"] = "TOWNHOUSE";
    PropertyType["COMMERCIAL"] = "COMMERCIAL";
    PropertyType["INDUSTRIAL"] = "INDUSTRIAL";
    PropertyType["OTHER"] = "OTHER";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
// Service class for property operations
class PropertyService {
    /**
     * Create a new property
     * @param data Property data
     * @returns The created property
     */
    async createProperty(data) {
        try {
            // Format amenities as JSON if provided
            const formattedData = {
                ...data,
                amenities: data.amenities ? data.amenities : undefined,
                country: data.country || 'USA',
                isActive: true
            };
            const property = await database_1.prisma.property.create({
                data: formattedData,
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
                    }
                }
            });
            return property;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Get a property by ID
     * @param id Property ID
     * @returns The property if found
     */
    async getPropertyById(id) {
        try {
            const property = await database_1.prisma.property.findUnique({
                where: { id },
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
                    units: true,
                    documents: true
                }
            });
            return property;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Get properties with filtering, pagination, and sorting
     * @param filters Filter parameters
     * @param page Page number (1-based)
     * @param limit Number of items per page
     * @param sortField Field to sort by
     * @param sortOrder Sort direction ('asc' or 'desc')
     * @returns Paginated properties
     */
    async getProperties(filters = {}, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc') {
        try {
            // Build where clause from filters
            const where = {
                ...(filters.name && {
                    name: { contains: filters.name, mode: 'insensitive' }
                }),
                ...(filters.city && {
                    city: { contains: filters.city, mode: 'insensitive' }
                }),
                ...(filters.state && {
                    state: { contains: filters.state, mode: 'insensitive' }
                }),
                ...(filters.zipCode && {
                    zipCode: { contains: filters.zipCode }
                }),
                ...(filters.propertyType && {
                    propertyType: filters.propertyType
                }),
                ...(filters.minUnits && {
                    totalUnits: { gte: filters.minUnits }
                }),
                ...(filters.maxUnits && {
                    totalUnits: { lte: filters.maxUnits }
                }),
                ...(filters.managerId && {
                    managerId: filters.managerId
                }),
                ...(filters.ownerId && {
                    ownerId: filters.ownerId
                }),
                ...(filters.isActive !== undefined && {
                    isActive: filters.isActive
                })
            };
            // Get pagination params
            const { skip, take } = (0, dbUtils_1.getPaginationParams)(page, limit);
            // Get sort params
            const orderBy = (0, dbUtils_1.buildSortParams)(sortField, sortOrder);
            // Execute count and findMany in parallel
            const [total, properties] = await Promise.all([
                database_1.prisma.property.count({ where }),
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
                            select: {
                                id: true,
                                unitNumber: true,
                                isAvailable: true
                            }
                        }
                    }
                })
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                properties,
                total,
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
     * Update a property
     * @param id Property ID
     * @param data Update data
     * @returns The updated property
     */
    async updateProperty(id, data) {
        try {
            // Format amenities as JSON if provided
            const formattedData = {
                ...data,
                amenities: data.amenities ? data.amenities : undefined,
            };
            const property = await database_1.prisma.property.update({
                where: { id },
                data: formattedData,
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
                    units: true
                }
            });
            return property;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Set property active status
     * @param id Property ID
     * @param isActive Active status
     * @returns The updated property
     */
    async setPropertyStatus(id, isActive) {
        try {
            const property = await database_1.prisma.property.update({
                where: { id },
                data: { isActive }
            });
            return property;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Delete a property (soft delete by setting isActive to false)
     * @param id Property ID
     * @returns The deactivated property
     */
    async softDeleteProperty(id) {
        return this.setPropertyStatus(id, false);
    }
    /**
     * Permanently delete a property and related data
     * @param id Property ID
     * @returns True if successful
     */
    async hardDeleteProperty(id) {
        try {
            // Delete related units first
            await database_1.prisma.unit.deleteMany({
                where: { propertyId: id }
            });
            // Delete property documents
            await database_1.prisma.document.deleteMany({
                where: { propertyId: id }
            });
            // Delete the property
            await database_1.prisma.property.delete({
                where: { id }
            });
            return true;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Count properties by type
     * @returns Count of properties by type
     */
    async countPropertiesByType() {
        try {
            const counts = await database_1.prisma.property.groupBy({
                by: ['propertyType'],
                _count: {
                    id: true
                }
            });
            // Convert to record format
            const result = {};
            counts.forEach((count) => {
                if (count.propertyType) {
                    result[count.propertyType] = count._count.id;
                }
            });
            // Ensure all property types are represented
            Object.values(PropertyType).forEach((type) => {
                if (result[type] === undefined) {
                    result[type] = 0;
                }
            });
            return result;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
}
exports.PropertyService = PropertyService;
// Export a singleton instance
exports.propertyService = new PropertyService();
//# sourceMappingURL=propertyService.js.map