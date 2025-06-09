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
exports.deleteEmergencyProtocol = exports.updateEmergencyProtocol = exports.createEmergencyProtocol = exports.getEmergencyProtocolsByPropertyId = void 0;
const emergencyProtocolService = __importStar(require("../services/emergencyProtocol.service"));
const getEmergencyProtocolsByPropertyId = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const emergencyProtocols = await emergencyProtocolService.getEmergencyProtocolsByPropertyId(propertyId);
        res.status(200).json(emergencyProtocols);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEmergencyProtocolsByPropertyId = getEmergencyProtocolsByPropertyId;
const createEmergencyProtocol = async (req, res) => {
    try {
        const emergencyProtocol = await emergencyProtocolService.createEmergencyProtocol(req.body);
        res.status(201).json(emergencyProtocol);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createEmergencyProtocol = createEmergencyProtocol;
const updateEmergencyProtocol = async (req, res) => {
    try {
        const { id } = req.params;
        const emergencyProtocol = await emergencyProtocolService.updateEmergencyProtocol(id, req.body);
        res.status(200).json(emergencyProtocol);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateEmergencyProtocol = updateEmergencyProtocol;
const deleteEmergencyProtocol = async (req, res) => {
    try {
        const { id } = req.params;
        await emergencyProtocolService.deleteEmergencyProtocol(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteEmergencyProtocol = deleteEmergencyProtocol;
//# sourceMappingURL=emergencyProtocol.controller.js.map