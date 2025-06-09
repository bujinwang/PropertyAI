"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBusinessHours = exports.updateBusinessHours = exports.createBusinessHours = exports.getBusinessHoursByPropertyId = void 0;
const businessHoursService = __importStar(require("../services/businessHours.service"));
const getBusinessHoursByPropertyId = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const businessHours = await businessHoursService.getBusinessHoursByPropertyId(propertyId);
        res.status(200).json(businessHours);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getBusinessHoursByPropertyId = getBusinessHoursByPropertyId;
const createBusinessHours = async (req, res) => {
    try {
        const businessHours = await businessHoursService.createBusinessHours(req.body);
        res.status(201).json(businessHours);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createBusinessHours = createBusinessHours;
const updateBusinessHours = async (req, res) => {
    try {
        const { id } = req.params;
        const businessHours = await businessHoursService.updateBusinessHours(id, req.body);
        res.status(200).json(businessHours);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateBusinessHours = updateBusinessHours;
const deleteBusinessHours = async (req, res) => {
    try {
        const { id } = req.params;
        await businessHoursService.deleteBusinessHours(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteBusinessHours = deleteBusinessHours;
//# sourceMappingURL=businessHours.controller.js.map