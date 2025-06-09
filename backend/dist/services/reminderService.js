"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const notificationService_1 = require("./notificationService");
const prisma = new client_1.PrismaClient();
class ReminderService {
    async sendReminders() {
        const leases = await prisma.lease.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                tenant: true,
            },
        });
        for (const lease of leases) {
            const dueDate = new Date(lease.endDate);
            const today = new Date();
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
                const message = `Your rent payment of $${lease.rentAmount} is due in ${diffDays} days.`;
                await (0, notificationService_1.sendNotification)('email', lease.tenant.email, 'Upcoming Rent Payment', message);
                if (lease.tenant.phone) {
                    await (0, notificationService_1.sendNotification)('sms', lease.tenant.phone, 'Upcoming Rent Payment', message);
                }
            }
        }
    }
}
exports.default = new ReminderService();
//# sourceMappingURL=reminderService.js.map