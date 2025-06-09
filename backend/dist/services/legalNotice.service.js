"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legalNoticeService = void 0;
const database_1 = require("../config/database");
const emailService_1 = require("./emailService");
const smsService_1 = require("./smsService");
class LegalNoticeService {
    async sendLegalNotice(tenantId, message) {
        const tenant = await database_1.prisma.user.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        const subject = 'Important Legal Notice';
        await (0, emailService_1.sendEmail)(tenant.email, subject, message);
        if (tenant.phone) {
            await (0, smsService_1.sendSms)(tenant.phone, `Important Legal Notice: ${message}`);
        }
        // Track the delivery of the legal notice
        await database_1.prisma.notification.create({
            data: {
                title: subject,
                message,
                type: 'OTHER',
                userId: tenantId,
            },
        });
    }
}
exports.legalNoticeService = new LegalNoticeService();
//# sourceMappingURL=legalNotice.service.js.map