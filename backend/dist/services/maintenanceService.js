"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceService = void 0;
const database_1 = require("../config/database");
const serviceUtils_1 = require("../utils/serviceUtils");
const dbUtils_1 = require("../utils/dbUtils");
/**
 * Service for handling maintenance requests
 */
class MaintenanceService {
    /**
     * Create a new maintenance request
     * This demonstrates inter-service communication by validating both property and user data
     */
    async createMaintenanceRequest(data) {
        try {
            // Validate that the unit exists
            const unit = await database_1.prisma.unit.findUnique({
                where: { id: data.unitId },
                select: { id: true, propertyId: true }
            });
            if (!unit) {
                throw new Error('Unit not found');
            }
            // Use inter-service communication to validate the property
            const property = await serviceUtils_1.ServiceCommunication.validateProperty(unit.propertyId);
            if (!property.isActive) {
                throw new Error('Property is not active');
            }
            // Use inter-service communication to validate the user
            const user = await serviceUtils_1.ServiceCommunication.validateUser(data.requestedById);
            if (!user.isActive) {
                throw new Error('User account is not active');
            }
            // Create the maintenance request
            const maintenanceRequest = await database_1.prisma.maintenanceRequest.create({
                data: {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    status: 'OPEN',
                    unit: { connect: { id: data.unitId } },
                    property: { connect: { id: unit.propertyId } },
                    requestedBy: { connect: { id: data.requestedById } }
                },
                include: {
                    unit: {
                        select: {
                            id: true,
                            unitNumber: true
                        }
                    },
                    property: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            city: true,
                            state: true
                        }
                    }
                }
            });
            // Use inter-service communication to get additional user details
            const requestedBy = await serviceUtils_1.ServiceCommunication.getUserBasicInfo(data.requestedById);
            // Return the combined result
            return {
                ...maintenanceRequest,
                requestedBy
            };
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
    /**
     * Get a maintenance request by ID
     * Demonstrates combining data from multiple services
     */
    async getMaintenanceRequestById(id) {
        try {
            const maintenanceRequest = await database_1.prisma.maintenanceRequest.findUnique({
                where: { id },
                include: {
                    unit: {
                        select: {
                            id: true,
                            unitNumber: true
                        }
                    },
                    property: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            if (!maintenanceRequest) {
                throw new Error('Maintenance request not found');
            }
            // Use inter-service communication to get property details
            const propertyDetails = await serviceUtils_1.ServiceCommunication.getPropertyBasicInfo(maintenanceRequest.property.id);
            // Use inter-service communication to get user details
            const requestedBy = await serviceUtils_1.ServiceCommunication.getUserBasicInfo(maintenanceRequest.requestedById);
            // Combine the data from different services
            return {
                ...maintenanceRequest,
                property: {
                    ...maintenanceRequest.property,
                    ...propertyDetails
                },
                requestedBy
            };
        }
        catch (error) {
            throw (0, dbUtils_1.handleDatabaseError)(error);
        }
    }
}
exports.MaintenanceService = MaintenanceService;
//# sourceMappingURL=maintenanceService.js.map