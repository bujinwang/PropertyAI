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
exports.deleteEscalationPolicyRule = exports.updateEscalationPolicyRule = exports.createEscalationPolicyRule = exports.deleteEscalationPolicy = exports.updateEscalationPolicy = exports.createEscalationPolicy = exports.getEscalationPoliciesByPropertyId = void 0;
const escalationPolicyService = __importStar(require("../services/escalationPolicy.service"));
const getEscalationPoliciesByPropertyId = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const escalationPolicies = await escalationPolicyService.getEscalationPoliciesByPropertyId(propertyId);
        res.status(200).json(escalationPolicies);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getEscalationPoliciesByPropertyId = getEscalationPoliciesByPropertyId;
const createEscalationPolicy = async (req, res) => {
    try {
        const escalationPolicy = await escalationPolicyService.createEscalationPolicy(req.body);
        res.status(201).json(escalationPolicy);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createEscalationPolicy = createEscalationPolicy;
const updateEscalationPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const escalationPolicy = await escalationPolicyService.updateEscalationPolicy(id, req.body);
        res.status(200).json(escalationPolicy);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateEscalationPolicy = updateEscalationPolicy;
const deleteEscalationPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        await escalationPolicyService.deleteEscalationPolicy(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteEscalationPolicy = deleteEscalationPolicy;
const createEscalationPolicyRule = async (req, res) => {
    try {
        const escalationPolicyRule = await escalationPolicyService.createEscalationPolicyRule(req.body);
        res.status(201).json(escalationPolicyRule);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createEscalationPolicyRule = createEscalationPolicyRule;
const updateEscalationPolicyRule = async (req, res) => {
    try {
        const { id } = req.params;
        const escalationPolicyRule = await escalationPolicyService.updateEscalationPolicyRule(id, req.body);
        res.status(200).json(escalationPolicyRule);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateEscalationPolicyRule = updateEscalationPolicyRule;
const deleteEscalationPolicyRule = async (req, res) => {
    try {
        const { id } = req.params;
        await escalationPolicyService.deleteEscalationPolicyRule(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteEscalationPolicyRule = deleteEscalationPolicyRule;
//# sourceMappingURL=escalationPolicy.controller.js.map