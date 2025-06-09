"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentExpirationService = void 0;
const database_1 = require("../config/database");
const node_schedule_1 = require("node-schedule");
const emailService_1 = require("./emailService");
class DocumentExpirationService {
    initialize() {
        // Schedule a job to run every day at midnight to check for expiring documents
        (0, node_schedule_1.scheduleJob)('0 0 * * *', this.sendExpirationReminders);
    }
    async sendExpirationReminders() {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiringLeases = await database_1.prisma.lease.findMany({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: today,
                    lte: thirtyDaysFromNow,
                },
            },
            include: {
                tenant: true,
            },
        });
        for (const lease of expiringLeases) {
            const subject = 'Lease Renewal Reminder';
            const message = `Dear ${lease.tenant.firstName},\n\nThis is a reminder that your lease is expiring on ${lease.endDate.toDateString()}.\n\nPlease contact us to discuss renewal options.\n\nThank you,\nPropertyAI`;
            await (0, emailService_1.sendEmail)(lease.tenant.email, subject, message);
        }
    }
}
exports.documentExpirationService = new DocumentExpirationService();
//# sourceMappingURL=documentExpiration.service.js.map