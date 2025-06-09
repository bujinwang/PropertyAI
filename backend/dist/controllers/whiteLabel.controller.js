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
exports.deleteWhiteLabelConfig = exports.updateWhiteLabelConfig = exports.createWhiteLabelConfig = exports.getWhiteLabelConfigByPropertyId = void 0;
const whiteLabelService = __importStar(require("../services/whiteLabel.service"));
const getWhiteLabelConfigByPropertyId = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const whiteLabelConfig = await whiteLabelService.getWhiteLabelConfigByPropertyId(propertyId);
        res.status(200).json(whiteLabelConfig);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getWhiteLabelConfigByPropertyId = getWhiteLabelConfigByPropertyId;
const createWhiteLabelConfig = async (req, res) => {
    try {
        const whiteLabelConfig = await whiteLabelService.createWhiteLabelConfig(req.body);
        res.status(201).json(whiteLabelConfig);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createWhiteLabelConfig = createWhiteLabelConfig;
const updateWhiteLabelConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const whiteLabelConfig = await whiteLabelService.updateWhiteLabelConfig(id, req.body);
        res.status(200).json(whiteLabelConfig);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateWhiteLabelConfig = updateWhiteLabelConfig;
const deleteWhiteLabelConfig = async (req, res) => {
    try {
        const { id } = req.params;
        await whiteLabelService.deleteWhiteLabelConfig(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteWhiteLabelConfig = deleteWhiteLabelConfig;
//# sourceMappingURL=whiteLabel.controller.js.map