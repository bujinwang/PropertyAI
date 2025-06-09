"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentimentService = void 0;
const database_1 = require("../config/database");
const translation_service_1 = require("./translation.service");
const aiOrchestrationService_1 = __importDefault(require("./aiOrchestrationService"));
class SentimentService {
    async analyzeAndSaveSentiment(messageId, text) {
        try {
            const translatedText = await translation_service_1.translationService.translate(text, 'en');
            const response = await aiOrchestrationService_1.default.completion({
                model: 'claude-3-opus-20240229',
                messages: [
                    {
                        role: 'system',
                        content: 'Analyze the sentiment of the following text and classify it as POSITIVE, NEGATIVE, or NEUTRAL.',
                    },
                    {
                        role: 'user',
                        content: translatedText,
                    },
                ],
            });
            const sentiment = response.choices[0].message.content.toUpperCase();
            await database_1.prisma.message.update({
                where: { id: messageId },
                data: { sentiment },
            });
        }
        catch (error) {
            console.error('Error analyzing and saving sentiment:', error);
        }
    }
}
exports.sentimentService = new SentimentService();
//# sourceMappingURL=sentiment.service.js.map