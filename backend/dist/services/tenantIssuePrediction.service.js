"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictTenantIssues = exports.getMaintenanceRequests = exports.getTenantIssuePredictionById = exports.getTenantIssuePredictions = void 0;
const client_1 = require("@prisma/client");
const predictiveModels_1 = require("../utils/predictiveModels");
const prisma = new client_1.PrismaClient();
/**
 * Fetches all tenant issue predictions.
 * @returns A promise that resolves to an array of all tenant issue predictions.
 */
const getTenantIssuePredictions = async () => {
    return prisma.tenantIssuePrediction.findMany();
};
exports.getTenantIssuePredictions = getTenantIssuePredictions;
/**
 * Fetches a tenant issue prediction by its ID.
 * @param id The ID of the tenant issue prediction to fetch.
 * @returns A promise that resolves to the tenant issue prediction, or null if not found.
 */
const getTenantIssuePredictionById = async (id) => {
    return prisma.tenantIssuePrediction.findUnique({
        where: { id },
    });
};
exports.getTenantIssuePredictionById = getTenantIssuePredictionById;
/**
 * Fetches all maintenance requests, which can be used as a source for tenant issues.
 * @returns A promise that resolves to an array of all maintenance requests.
 */
const getMaintenanceRequests = async () => {
    return prisma.maintenanceRequest.findMany({
        include: {
            property: true,
            unit: true,
            requestedBy: true,
        },
    });
};
exports.getMaintenanceRequests = getMaintenanceRequests;
/**
 * Predicts tenant issues based on historical data.
 * This function uses a mock prediction model.
 * @param tenantId The ID of the tenant to predict issues for.
 * @returns A promise that resolves to a prediction object.
 */
const predictTenantIssues = async (tenantId) => {
    const tenant = await prisma.user.findUnique({
        where: { id: tenantId },
        include: {
            maintenanceRequests: true,
            leases: {
                include: {
                    transactions: true,
                },
            },
        },
    });
    if (!tenant) {
        throw new Error('Tenant not found');
    }
    const tenantData = {
        ...tenant,
        payments: tenant.leases.flatMap(l => l.transactions),
    };
    return (0, predictiveModels_1.predictTenantIssue)(tenantData);
};
exports.predictTenantIssues = predictTenantIssues;
//# sourceMappingURL=tenantIssuePrediction.service.js.map