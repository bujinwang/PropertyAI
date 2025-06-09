"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knowledgeBaseService_1 = __importDefault(require("./knowledgeBaseService"));
const natural_1 = __importDefault(require("natural"));
class SuggestionService {
    async getSuggestions(query) {
        const entries = await knowledgeBaseService_1.default.getEntries();
        const suggestions = entries
            .map((entry) => {
            const score = this.calculateScore(query, entry.keywords);
            return { ...entry, score };
        })
            .filter((entry) => entry.score > 0.5)
            .sort((a, b) => b.score - a.score);
        return suggestions;
    }
    calculateScore(query, keywords) {
        const tokenizer = new natural_1.default.WordTokenizer();
        const queryTokens = tokenizer.tokenize(query.toLowerCase());
        let maxScore = 0;
        for (const keyword of keywords) {
            const keywordTokens = tokenizer.tokenize(keyword.toLowerCase());
            for (const queryToken of queryTokens) {
                for (const keywordToken of keywordTokens) {
                    const score = natural_1.default.JaroWinklerDistance(queryToken, keywordToken, {});
                    if (score > maxScore) {
                        maxScore = score;
                    }
                }
            }
        }
        return maxScore;
    }
}
exports.default = new SuggestionService();
//# sourceMappingURL=suggestionService.js.map