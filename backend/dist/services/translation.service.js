"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationService = void 0;
const aiOrchestrationService_1 = __importDefault(require("./aiOrchestrationService"));
class TranslationService {
    async translate(text, targetLanguage) {
        try {
            const response = await aiOrchestrationService_1.default.completion({
                model: 'claude-3-opus-20240229',
                messages: [
                    {
                        role: 'system',
                        content: `Translate the following text to ${targetLanguage}.`,
                    },
                    {
                        role: 'user',
                        content: text,
                    },
                ],
            });
            return response.choices[0].message.content;
        }
        catch (error) {
            console.error('Error translating text:', error);
            throw new Error('Failed to translate text');
        }
    }
}
exports.translationService = new TranslationService();
//# sourceMappingURL=translation.service.js.map