"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeBaseService = void 0;
const database_1 = require("../config/database");
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
class KnowledgeBaseService {
    async getSolutionForIssue(issue) {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const prompt = `Provide a solution for the following issue: ${issue}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    }
    async addKnowledgeBaseEntry(buildingId, issue, solution) {
        await database_1.prisma.knowledgeBase.create({
            data: {
                buildingId,
                issue,
                solution,
            },
        });
    }
}
exports.knowledgeBaseService = new KnowledgeBaseService();
//# sourceMappingURL=knowledgeBase.service.js.map