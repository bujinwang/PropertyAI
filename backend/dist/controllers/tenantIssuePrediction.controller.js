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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictTenantIssues = exports.getTenantIssuePredictionById = exports.getTenantIssuePredictions = void 0;
const tenantIssuePredictionService = __importStar(require("../services/tenantIssuePrediction.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Handles the request to get all tenant issue predictions.
 * @param req The request object.
 * @param res The response object.
 */
const getTenantIssuePredictions = async (req, res) => {
    try {
        const predictions = await tenantIssuePredictionService.getTenantIssuePredictions();
        res.status(200).json(predictions);
    }
    catch (error) {
        logger_1.default.error(`Error getting tenant issue predictions: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTenantIssuePredictions = getTenantIssuePredictions;
/**
 * Handles the request to get a tenant issue prediction by its ID.
 * @param req The request object.
 * @param res The response object.
 */
const getTenantIssuePredictionById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }
    try {
        const prediction = await tenantIssuePredictionService.getTenantIssuePredictionById(id);
        if (!prediction) {
            return res.status(404).json({ error: 'Prediction not found' });
        }
        res.status(200).json(prediction);
    }
    catch (error) {
        logger_1.default.error(`Error getting tenant issue prediction by ID: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTenantIssuePredictionById = getTenantIssuePredictionById;
/**
 * Handles the request to predict tenant issues.
 * @param req The request object.
 * @param res The response object.
 */
const predictTenantIssues = async (req, res) => {
    const { tenantId } = req.params;
    if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
    }
    try {
        const prediction = await tenantIssuePredictionService.predictTenantIssues(tenantId);
        res.status(200).json(prediction);
    }
    catch (error) {
        logger_1.default.error(`Error predicting tenant issues: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.predictTenantIssues = predictTenantIssues;
//# sourceMappingURL=tenantIssuePrediction.controller.js.map