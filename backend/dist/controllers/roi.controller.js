"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoi = void 0;
const roi_service_1 = require("../services/roi.service");
const logger_1 = __importDefault(require("../utils/logger"));
const getRoi = async (req, res) => {
    const { propertyId } = req.params;
    if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
    }
    try {
        const roi = await roi_service_1.roiService.calculateRoi(propertyId);
        res.status(200).json(roi);
    }
    catch (error) {
        logger_1.default.error(`Error calculating ROI: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getRoi = getRoi;
//# sourceMappingURL=roi.controller.js.map