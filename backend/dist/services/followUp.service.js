"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followUpService = void 0;
const database_1 = require("../config/database");
const translation_service_1 = require("./translation.service");
const aiOrchestrationService_1 = __importDefault(require("./aiOrchestrationService"));
class FollowUpService {
    async scheduleFollowUp(messageId, followUpAt) {
        return database_1.prisma.followUp.create({
            data: {
                messageId,
                status: 'SCHEDULED',
                followUpAt,
            },
        });
    }
    async getFollowUps() {
        return database_1.prisma.followUp.findMany({
            where: {
                status: 'SCHEDULED',
                followUpAt: {
                    lte: new Date(),
                },
            },
            include: {
                message: {
                    include: {
                        sender: true,
                    },
                },
            },
        });
    }
    async sendFollowUp(followUp) {
        try {
            const { messageId } = followUp;
            const translatedText = await translation_service_1.translationService.translate(message.content, 'en');
            const response = await aiOrchestrationService_1.default.completion({
                model: 'claude-3-opus-20240229',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Write a follow-up message for the following text.',
                    },
                    {
                        role: 'user',
                        content: translatedText,
                    },
                ],
            });
            const followUpMessage = response.choices[0].message.content;
            // Here you would typically send the follow-up message via email, SMS, etc.
            console.log(`Sending follow-up message to ${message.sender.email}: ${followUpMessage}`);
            await database_1.prisma.followUp.update({
                where: { id: followUp.id },
                data: { status: 'SENT' },
            });
        }
        catch (error) {
            console.error('Error sending follow-up:', error);
        }
    }
}
exports.followUpService = new FollowUpService();
//# sourceMappingURL=followUp.service.js.map