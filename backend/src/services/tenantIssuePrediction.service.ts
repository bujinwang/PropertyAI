import { PrismaClient, User, MaintenanceRequest, Transaction } from '@prisma/client';
import { predictTenantIssue } from '../utils/predictiveModels';

const prisma = new PrismaClient();

/**
 * Fetches all tenant issue predictions.
 * @returns A promise that resolves to an array of all tenant issue predictions.
 */
export const getTenantIssuePredictions = async () => {
  return prisma.tenantIssuePrediction.findMany();
};

/**
 * Fetches a tenant issue prediction by its ID.
 * @param id The ID of the tenant issue prediction to fetch.
 * @returns A promise that resolves to the tenant issue prediction, or null if not found.
 */
export const getTenantIssuePredictionById = async (id: string) => {
  return prisma.tenantIssuePrediction.findUnique({
    where: { id },
  });
};

/**
 * Fetches all maintenance requests, which can be used as a source for tenant issues.
 * @returns A promise that resolves to an array of all maintenance requests.
 */
export const getMaintenanceRequests = async () => {
  return prisma.maintenanceRequest.findMany({
    include: {
      property: true,
      unit: true,
      requestedBy: true,
    },
  });
};

/**
 * Predicts tenant issues based on historical data.
 * This function will integrate with a real prediction model.
 * @param tenantId The ID of the tenant to predict issues for.
 * @returns A promise that resolves to a prediction object.
 */
export const predictTenantIssues = async (tenantId: string) => {
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

  return predictTenantIssue(tenantData);
};
