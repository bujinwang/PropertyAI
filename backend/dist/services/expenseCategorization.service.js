"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseCategorizationService = void 0;
const database_1 = require("../config/database");
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
class ExpenseCategorizationService {
    async categorizeExpense(transactionId) {
        const transaction = await database_1.prisma.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!transaction) {
            return null;
        }
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const prompt = `Categorize the following expense for tax purposes: "${transaction.description}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const category = response.text();
        return category;
    }
}
exports.expenseCategorizationService = new ExpenseCategorizationService();
//# sourceMappingURL=expenseCategorization.service.js.map