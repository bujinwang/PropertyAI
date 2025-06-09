"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knowledgeBaseService_1 = __importDefault(require("../services/knowledgeBaseService"));
class KnowledgeBaseController {
    async createEntry(req, res) {
        try {
            const entry = await knowledgeBaseService_1.default.createEntry(req.body);
            res.status(201).json(entry);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getEntry(req, res) {
        try {
            const entry = await knowledgeBaseService_1.default.getEntry(req.params.id);
            if (entry) {
                res.status(200).json(entry);
            }
            else {
                res.status(404).json({ message: 'Entry not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getEntries(req, res) {
        try {
            const entries = await knowledgeBaseService_1.default.getEntries();
            res.status(200).json(entries);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateEntry(req, res) {
        try {
            const entry = await knowledgeBaseService_1.default.updateEntry(req.params.id, req.body);
            res.status(200).json(entry);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteEntry(req, res) {
        try {
            await knowledgeBaseService_1.default.deleteEntry(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new KnowledgeBaseController();
//# sourceMappingURL=knowledgeBaseController.js.map