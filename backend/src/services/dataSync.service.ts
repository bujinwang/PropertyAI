import ApiService from './api.service';
import { prisma } from '../config/database';

class DataSyncService {
  private propertyManagementApi: ApiService;

  constructor(propertyManagementApi: ApiService) {
    this.propertyManagementApi = propertyManagementApi;
  }

  public async syncRentPayments() {
    try {
      const payments = await this.propertyManagementApi.get('payments');
      for (const payment of payments) {
        await prisma.transaction.upsert({
          where: { id: payment.id },
          update: {
            amount: payment.amount,
            status: payment.status,
            processedAt: payment.processedAt,
          },
          create: {
            id: payment.id,
            amount: payment.amount,
            type: 'RENT',
            status: payment.status,
            description: 'Rent payment',
            leaseId: payment.leaseId,
            paymentMethod: payment.paymentMethod,
            reference: payment.id,
            processedAt: payment.processedAt,
          },
        });
      }
    } catch (error) {
      console.error('Error syncing rent payments:', error);
      throw error;
    }
  }

  public async syncLeaseData() {
    try {
      const leases = await this.propertyManagementApi.get('leases');
      for (const lease of leases) {
        await prisma.lease.upsert({
          where: { id: lease.id },
          update: {
            startDate: lease.startDate,
            endDate: lease.endDate,
            rentAmount: lease.rentAmount,
            status: lease.status,
          },
          create: {
            id: lease.id,
            startDate: lease.startDate,
            endDate: lease.endDate,
            rentAmount: lease.rentAmount,
            securityDeposit: lease.securityDeposit,
            leaseTerms: lease.leaseTerms,
            status: lease.status,
            signedDate: lease.signedDate,
            unitId: lease.unitId,
            tenantId: lease.tenantId,
          },
        });
      }
    } catch (error) {
      console.error('Error syncing lease data:', error);
      throw error;
    }
  }
}

export default DataSyncService;
