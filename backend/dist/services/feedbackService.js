"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class FeedbackService {
    async createFeedback(requestId, isCorrect, correctedUrgency, correctedType) {
        // This is a placeholder for the actual implementation
        console.log(`Feedback received for request ${requestId}: ${isCorrect ? 'correct' : 'incorrect'}`);
        if (!isCorrect) {
            console.log(`Corrected urgency: ${correctedUrgency}, corrected type: ${correctedType}`);
        }
    }
}
exports.default = new FeedbackService();
//# sourceMappingURL=feedbackService.js.map