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
exports.deleteApiKey = exports.getApiKeysByUserId = exports.generateApiKey = void 0;
const apiKeyService = __importStar(require("../services/apiKey.service"));
const generateApiKey = async (req, res) => {
    try {
        const { userId, permissions, expiresAt } = req.body;
        const apiKey = await apiKeyService.generateApiKey(userId, permissions, expiresAt);
        res.status(201).json(apiKey);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.generateApiKey = generateApiKey;
const getApiKeysByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const apiKeys = await apiKeyService.getApiKeysByUserId(userId);
        res.status(200).json(apiKeys);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getApiKeysByUserId = getApiKeysByUserId;
const deleteApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        await apiKeyService.deleteApiKey(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteApiKey = deleteApiKey;
//# sourceMappingURL=apiKey.controller.js.map