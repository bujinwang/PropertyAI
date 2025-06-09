"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentUrl = void 0;
const document_service_1 = require("../services/document.service");
const logger_1 = __importDefault(require("../utils/logger"));
const getDocumentUrl = async (req, res) => {
    const { documentId } = req.params;
    if (!documentId) {
        return res.status(400).json({ error: 'Document ID is required' });
    }
    try {
        const url = await document_service_1.documentService.getSignedUrlForDocument(documentId);
        if (url) {
            res.status(200).json({ url });
        }
        else {
            res.status(404).json({ error: 'Document not found' });
        }
    }
    catch (error) {
        logger_1.default.error(`Error getting document URL: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDocumentUrl = getDocumentUrl;
//# sourceMappingURL=document.controller.js.map