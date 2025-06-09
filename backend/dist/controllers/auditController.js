"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auditService_1 = __importDefault(require("../services/auditService"));
class AuditController {
    async createEntry(req, res) {
        try {
            const { userId, action, details } = req.body;
            await auditService_1.default.createAuditEntry(userId, action, details);
            res.status(201).json({ message: 'Audit entry created successfully' });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getEntries(req, res) {
        try {
            const entries = await auditService_1.default.getAuditEntries();
            res.status(200).json(entries);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new AuditController();
//# sourceMappingURL=auditController.js.map