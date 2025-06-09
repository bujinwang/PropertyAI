"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitService = exports.UnitService = void 0;
const database_1 = require("../config/database");
const dbUtils_1 = require("../utils/dbUtils");
// Service class for unit operations
class UnitService {
    /**
     * Create a new unit
     * @param data Unit data
     * @returns The created unit
     */
    async createUnit(data) {
        try {
            // Format features as JSON if provided
            const formattedData = {
                ...data,
                features: data.features || undefined,
                isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
            };
            const unit = await database_1.prisma.unit.create({
                data: formattedData,
                include: {
                    property: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            city: true,
                            state: true,
                        }
                    },
                    tenant: data.tenantId ? {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    } : undefined
                }
            });
            return unit;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Get a unit by ID
     * @param id Unit ID
     * @returns The unit if found
     */
    async getUnitById(id) {
        try {
            const unit = await database_1.prisma.unit.findUnique({
                where: { id },
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
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true
                        }
                    },
                    lease: true,
                    maintenanceRequests: {
                        where: {
                            status: {
                                not: 'CANCELLED'
                            }
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 5
                    }
                }
            });
            return unit;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Get units with filtering, pagination, and sorting
     * @param filters Filter parameters
     * @param page Page number (1-based)
     * @param limit Number of items per page
     * @param sortField Field to sort by
     * @param sortOrder Sort direction ('asc' or 'desc')
     * @returns Paginated units
     */
    async getUnits(filters = {}, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc') {
        try {
            // Build where clause from filters
            const where = {
                ...(filters.unitNumber && {
                    unitNumber: { contains: filters.unitNumber }
                }),
                ...(filters.propertyId && {
                    propertyId: filters.propertyId
                }),
                ...(filters.minBedrooms && {
                    bedrooms: { gte: filters.minBedrooms }
                }),
                ...(filters.maxBedrooms && {
                    bedrooms: { lte: filters.maxBedrooms }
                }),
                ...(filters.minBathrooms && {
                    bathrooms: { gte: filters.minBathrooms }
                }),
                ...(filters.maxBathrooms && {
                    bathrooms: { lte: filters.maxBathrooms }
                }),
                ...(filters.minRent && {
                    rent: { gte: filters.minRent }
                }),
                ...(filters.maxRent && {
                    rent: { lte: filters.maxRent }
                }),
                ...(filters.isAvailable !== undefined && {
                    isAvailable: filters.isAvailable
                }),
                ...(filters.tenantId && {
                    tenantId: filters.tenantId
                })
            };
            // Get pagination params
            const { skip, take } = (0, dbUtils_1.getPaginationParams)(page, limit);
            // Get sort params
            const orderBy = (0, dbUtils_1.buildSortParams)(sortField, sortOrder);
            // Execute count and findMany in parallel
            const [total, units] = await Promise.all([
                database_1.prisma.unit.count({ where }),
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
                                state: true
                            }
                        },
                        tenant: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        lease: {
                            select: {
                                id: true,
                                startDate: true,
                                endDate: true,
                                status: true
                            }
                        }
                    }
                })
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                units,
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
     * Get units by property ID
     * @param propertyId Property ID
     * @param includeUnavailable Whether to include unavailable units
     * @returns List of units for the property
     */
    async getUnitsByPropertyId(propertyId, includeUnavailable = false) {
        try {
            const where = {
                propertyId
            };
            // Only include available units if specified
            if (!includeUnavailable) {
                where.isAvailable = true;
            }
            const units = await database_1.prisma.unit.findMany({
                where,
                include: {
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    lease: {
                        select: {
                            id: true,
                            startDate: true,
                            endDate: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    unitNumber: 'asc'
                }
            });
            return units;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Update a unit
     * @param id Unit ID
     * @param data Update data
     * @returns The updated unit
     */
    async updateUnit(id, data) {
        try {
            // Format features as JSON if provided
            const formattedData = {
                ...data,
                features: data.features || undefined
            };
            const unit = await database_1.prisma.unit.update({
                where: { id },
                data: formattedData,
                include: {
                    property: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            city: true,
                            state: true
                        }
                    },
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    lease: true
                }
            });
            return unit;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Set unit availability
     * @param id Unit ID
     * @param isAvailable Availability status
     * @param dateAvailable Date when unit becomes available (if setting to available)
     * @returns The updated unit
     */
    async setUnitAvailability(id, isAvailable, dateAvailable) {
        try {
            const updateData = { isAvailable };
            if (isAvailable && dateAvailable) {
                updateData.dateAvailable = dateAvailable;
            }
            const unit = await database_1.prisma.unit.update({
                where: { id },
                data: updateData
            });
            return unit;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Assign tenant to unit
     * @param id Unit ID
     * @param tenantId Tenant ID
     * @returns The updated unit
     */
    async assignTenant(id, tenantId) {
        try {
            const unit = await database_1.prisma.unit.update({
                where: { id },
                data: {
                    tenantId,
                    isAvailable: false
                },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
            return unit;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Remove tenant from unit
     * @param id Unit ID
     * @returns The updated unit
     */
    async removeTenant(id) {
        try {
            // Check if there's an active lease
            const currentUnit = await database_1.prisma.unit.findUnique({
                where: { id },
                include: {
                    lease: true
                }
            });
            if (currentUnit === null || currentUnit === void 0 ? void 0 : currentUnit.lease) {
                throw {
                    message: 'Cannot remove tenant with an active lease',
                    code: 'ACTIVE_LEASE_EXISTS',
                    status: 400
                };
            }
            const unit = await database_1.prisma.unit.update({
                where: { id },
                data: {
                    tenantId: null,
                    isAvailable: true
                }
            });
            return unit;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Delete a unit
     * @param id Unit ID
     * @returns True if successful
     */
    async deleteUnit(id) {
        try {
            // Check if unit has active lease or maintenance requests
            const unit = await database_1.prisma.unit.findUnique({
                where: { id },
                include: {
                    lease: true,
                    maintenanceRequests: {
                        where: {
                            status: {
                                not: 'COMPLETED'
                            }
                        }
                    }
                }
            });
            if (unit === null || unit === void 0 ? void 0 : unit.lease) {
                throw {
                    message: 'Cannot delete unit with an active lease',
                    code: 'ACTIVE_LEASE_EXISTS',
                    status: 400
                };
            }
            if ((unit === null || unit === void 0 ? void 0 : unit.maintenanceRequests) && unit.maintenanceRequests.length > 0) {
                throw {
                    message: 'Cannot delete unit with active maintenance requests',
                    code: 'ACTIVE_MAINTENANCE_EXISTS',
                    status: 400
                };
            }
            // Delete the unit
            await database_1.prisma.unit.delete({
                where: { id }
            });
            return true;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Get vacant units count for a property
     * @param propertyId Property ID
     * @returns Number of vacant units
     */
    async getVacantUnitsCount(propertyId) {
        try {
            const count = await database_1.prisma.unit.count({
                where: {
                    propertyId,
                    isAvailable: true
                }
            });
            return count;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Get occupancy rate for a property
     * @param propertyId Property ID
     * @returns Occupancy rate as a decimal (0-1)
     */
    async getOccupancyRate(propertyId) {
        try {
            // Get total units for property
            const totalUnits = await database_1.prisma.unit.count({
                where: { propertyId }
            });
            if (totalUnits === 0) {
                return 0;
            }
            // Get occupied units
            const occupiedUnits = await database_1.prisma.unit.count({
                where: {
                    propertyId,
                    isAvailable: false
                }
            });
            // Calculate occupancy rate
            return occupiedUnits / totalUnits;
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
}
exports.UnitService = UnitService;
// Export a singleton instance
exports.unitService = new UnitService();
//# sourceMappingURL=unitService.js.map