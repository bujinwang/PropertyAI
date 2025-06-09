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
exports.deleteAppliance = exports.updateAppliance = exports.getApplianceById = exports.createAppliance = exports.getAppliancesByUnitId = void 0;
const applianceService = __importStar(require("../services/appliance.service"));
const getAppliancesByUnitId = async (req, res) => {
    try {
        const { unitId } = req.params;
        const appliances = await applianceService.getAppliancesByUnitId(unitId);
        res.status(200).json(appliances);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAppliancesByUnitId = getAppliancesByUnitId;
const createAppliance = async (req, res) => {
    try {
        const appliance = await applianceService.createAppliance(req.body);
        res.status(201).json(appliance);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createAppliance = createAppliance;
const getApplianceById = async (req, res) => {
    try {
        const { id } = req.params;
        const appliance = await applianceService.getApplianceById(id);
        if (!appliance) {
            return res.status(404).json({ message: 'Appliance not found' });
        }
        res.status(200).json(appliance);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getApplianceById = getApplianceById;
const updateAppliance = async (req, res) => {
    try {
        const { id } = req.params;
        const appliance = await applianceService.updateAppliance(id, req.body);
        res.status(200).json(appliance);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateAppliance = updateAppliance;
const deleteAppliance = async (req, res) => {
    try {
        const { id } = req.params;
        await applianceService.deleteAppliance(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteAppliance = deleteAppliance;
//# sourceMappingURL=appliance.controller.js.map