"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class DataSyncService {
    constructor(propertyManagementApi) {
        this.propertyManagementApi = propertyManagementApi;
    }
    async syncRentPayments() {
        try {
            const payments = await this.propertyManagementApi.get('payments');
            for (const payment of payments) {
                await database_1.prisma.transaction.upsert({
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
        }
        catch (error) {
            console.error('Error syncing rent payments:', error);
            throw error;
        }
    }
    async syncLeaseData() {
        try {
            const leases = await this.propertyManagementApi.get('leases');
            for (const lease of leases) {
                await database_1.prisma.lease.upsert({
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
        }
        catch (error) {
            console.error('Error syncing lease data:', error);
            throw error;
        }
    }
}
exports.default = DataSyncService;
//# sourceMappingURL=dataSync.service.js.map