import { User, MaintenanceRequest, Transaction } from '@prisma/client';

interface TenantData {
  maintenanceRequests: MaintenanceRequest[];
  payments: Transaction[];
}

export const predictTenantIssue = async (tenant: User & TenantData): Promise<any> => {
  // TODO: Integrate with a real predictive model (e.g., a machine learning model deployed via an API).
  // For now, this remains a simplified, rule-based prediction.
  const { maintenanceRequests, payments } = tenant;

  const latePayments = payments.filter(p => p.status === 'FAILED').length;
  const frequentIssues = maintenanceRequests.length > 5;

  if (latePayments > 2 || frequentIssues) {
    return {
      issue: 'High risk of lease termination',
      confidence: 0.85,
    };
  }

  return {
    issue: 'Low risk',
    confidence: 0.95,
  };
};
