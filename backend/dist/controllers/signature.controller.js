"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signDocument = void 0;
const signature_service_1 = require("../services/signature.service");
const logger_1 = __importDefault(require("../utils/logger"));
const signDocument = async (req, res) => {
    const { documentId, userId, signature } = req.body;
    if (!documentId || !userId || !signature) {
        return res.status(400).json({ error: 'Document ID, user ID, and signature are required' });
    }
    try {
        const result = await signature_service_1.signatureService.signDocument(documentId, userId, signature);
        res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error(`Error signing document: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.signDocument = signDocument;
//# sourceMappingURL=signature.controller.js.map