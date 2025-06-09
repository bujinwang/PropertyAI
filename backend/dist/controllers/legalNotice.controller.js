"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLegalNotice = void 0;
const legalNotice_service_1 = require("../services/legalNotice.service");
const logger_1 = __importDefault(require("../utils/logger"));
const sendLegalNotice = async (req, res) => {
    const { tenantId, message } = req.body;
    if (!tenantId || !message) {
        return res.status(400).json({ error: 'Tenant ID and message are required' });
    }
    try {
        await legalNotice_service_1.legalNoticeService.sendLegalNotice(tenantId, message);
        res.status(200).json({ message: 'Legal notice sent successfully' });
    }
    catch (error) {
        logger_1.default.error(`Error sending legal notice: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.sendLegalNotice = sendLegalNotice;
//# sourceMappingURL=legalNotice.controller.js.map