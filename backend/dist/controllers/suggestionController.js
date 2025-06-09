"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const suggestionService_1 = __importDefault(require("../services/suggestionService"));
class SuggestionController {
    async getSuggestions(req, res) {
        try {
            const { query } = req.query;
            if (typeof query !== 'string') {
                return res.status(400).json({ message: 'Query must be a string' });
            }
            const suggestions = await suggestionService_1.default.getSuggestions(query);
            res.status(200).json(suggestions);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new SuggestionController();
//# sourceMappingURL=suggestionController.js.map