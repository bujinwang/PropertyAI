"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lateFeeService = void 0;
const database_1 = require("../config/database");
const node_schedule_1 = require("node-schedule");
const notificationService_1 = require("./notificationService");
class LateFeeService {
    initialize() {
        // Schedule a job to run every day at midnight to check for late payments
        (0, node_schedule_1.scheduleJob)('0 0 * * *', this.applyLateFees);
    }
    async applyLateFees() {
        const today = new Date();
        const leases = await database_1.prisma.lease.findMany({
            where: {
                status: 'ACTIVE',
                transactions: {
                    some: {
                        type: 'RENT',
                        status: 'PENDING',
                        createdAt: {
                            lt: today,
                        },
                    },
                },
            },
            include: {
                tenant: true,
                transactions: true,
            },
        });
        for (const lease of leases) {
            const rentTransaction = lease.transactions.find(t => t.type === 'RENT' && t.status === 'PENDING');
            if (rentTransaction) {
                const dueDate = new Date(rentTransaction.createdAt);
                const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays > 5) { // Apply late fee if payment is more than 5 days late
                    const lateFee = lease.rentAmount * 0.05; // 5% late fee
                    await database_1.prisma.transaction.create({
                        data: {
                            amount: lateFee,
                            type: 'FEES',
                            status: 'PENDING',
                            description: 'Late rent payment fee',
                            leaseId: lease.id,
                        },
                    });
                    const message = `A late fee of $${lateFee} has been applied to your account for the overdue rent payment.`;
                    await (0, notificationService_1.sendNotification)('email', lease.tenant.email, 'Late Fee Applied', message);
                    if (lease.tenant.phone) {
                        await (0, notificationService_1.sendNotification)('sms', lease.tenant.phone, 'Late Fee Applied', message);
                    }
                }
            }
        }
    }
}
exports.lateFeeService = new LateFeeService();
//# sourceMappingURL=lateFee.service.js.map