"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashFlowForecastingService = void 0;
const database_1 = require("../config/database");
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
class CashFlowForecastingService {
    async forecastCashFlow(months) {
        const transactions = await database_1.prisma.transaction.findMany({
            where: {
                status: 'COMPLETED',
            },
            orderBy: {
                processedAt: 'asc',
            },
        });
        if (!transactions.length) {
            return null;
        }
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const prompt = `Based on the following transactions, forecast the cash flow for the next ${months} months:\n\n${JSON.stringify(transactions)}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const forecast = response.text();
        return { forecast };
    }
}
exports.cashFlowForecastingService = new CashFlowForecastingService();
//# sourceMappingURL=cashFlowForecasting.service.js.map