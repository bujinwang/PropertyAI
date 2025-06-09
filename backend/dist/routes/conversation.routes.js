"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversation_controller_1 = require("../controllers/conversation.controller");
const router = (0, express_1.Router)();
const conversationController = new conversation_controller_1.ConversationController();
router.get('/:conversationId/messages', conversationController.getMessages);
exports.default = router;
//# sourceMappingURL=conversation.routes.js.map