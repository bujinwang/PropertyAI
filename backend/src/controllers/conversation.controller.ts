import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation.service';
import logger from '../utils/logger';

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  getMessages = async (req: Request, res: Response): Promise<void> => {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    try {
      const messages = await this.conversationService.getMessages(
        conversationId
      );
      res.status(200).json(messages);
    } catch (error) {
      logger.error(`Error in ConversationController.getMessages: ${error}`);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  };
}
