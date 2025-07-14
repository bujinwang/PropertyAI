import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';

const router = Router();
const conversationController = new ConversationController();

router.get('/:conversationId/messages', conversationController.getMessages);

export default router;
