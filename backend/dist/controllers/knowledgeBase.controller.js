"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addKnowledgeBaseEntry = exports.getSolution = void 0;
const knowledgeBase_service_1 = require("../services/knowledgeBase.service");
const logger_1 = __importDefault(require("../utils/logger"));
const getSolution = async (req, res) => {
    const { issue } = req.query;
    if (!issue) {
        return res.status(400).json({ error: 'Issue is required' });
    }
    try {
        const solution = await knowledgeBase_service_1.knowledgeBaseService.getSolutionForIssue(issue);
        res.status(200).json({ solution });
    }
    catch (error) {
        logger_1.default.error(`Error getting solution: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSolution = getSolution;
const addKnowledgeBaseEntry = async (req, res) => {
    const { buildingId, issue, solution } = req.body;
    if (!buildingId || !issue || !solution) {
        return res.status(400).json({ error: 'Building ID, issue, and solution are required' });
    }
    try {
        await knowledgeBase_service_1.knowledgeBaseService.addKnowledgeBaseEntry(buildingId, issue, solution);
        res.status(201).json({ message: 'Knowledge base entry added successfully' });
    }
    catch (error) {
        logger_1.default.error(`Error adding knowledge base entry: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addKnowledgeBaseEntry = addKnowledgeBaseEntry;
//# sourceMappingURL=knowledgeBase.controller.js.map