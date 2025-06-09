"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationController = void 0;
const conversation_service_1 = require("../services/conversation.service");
const logger_1 = __importDefault(require("../utils/logger"));
class ConversationController {
    constructor() {
        this.getMessages = async (req, res) => {
            const { conversationId } = req.params;
            if (!conversationId) {
                res.status(400).json({ error: 'Conversation ID is required' });
                return;
            }
            try {
                const messages = await this.conversationService.getMessages(parseInt(conversationId, 10));
                res.status(200).json(messages);
            }
            catch (error) {
                logger_1.default.error(`Error in ConversationController.getMessages: ${error}`);
                res.status(500).json({ error: 'Failed to fetch messages' });
            }
        };
        this.conversationService = new conversation_service_1.ConversationService();
    }
}
exports.ConversationController = ConversationController;
//# sourceMappingURL=conversation.controller.js.map