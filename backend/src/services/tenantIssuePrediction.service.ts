import { MaintenanceRequest, Transaction, User } from '@prisma/client';
import { prisma } from '../config/database';
import { predictTenantIssue } from '../utils/predictiveModels';

// The shared singleton from `config/database`. This module previously built its
// own `new PrismaClient()` at import time, which opened a SECOND connection pool
// per Jest worker: the pool was never `$disconnect()`ed, so Jest could not exit
// and `--detectOpenHandles` reported it as a lingering TCPWRAP. It also meant the
// module could not be imported without DATABASE_URL being set.

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
      Rental: true,
      User: true,
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
      MaintenanceRequest: true,
      Lease: {
        include: {
          Transaction: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const tenantData = {
    ...tenant,
    maintenanceRequests: tenant.MaintenanceRequest,
    payments: tenant.Lease.flatMap(l => l.Transaction),
  };

  return predictTenantIssue(tenantData);
};
