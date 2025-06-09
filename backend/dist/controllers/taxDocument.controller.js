"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTaxDocument = void 0;
const taxDocument_service_1 = require("../services/taxDocument.service");
const logger_1 = __importDefault(require("../utils/logger"));
const generateTaxDocument = async (req, res) => {
    const { propertyId, year } = req.params;
    if (!propertyId || !year) {
        return res.status(400).json({ error: 'Property ID and year are required' });
    }
    try {
        const filePath = await taxDocument_service_1.taxDocumentService.generateTaxDocument(propertyId, parseInt(year));
        if (filePath) {
            res.download(filePath);
        }
        else {
            res.status(404).json({ error: 'Property not found' });
        }
    }
    catch (error) {
        logger_1.default.error(`Error generating tax document: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.generateTaxDocument = generateTaxDocument;
//# sourceMappingURL=taxDocument.controller.js.map