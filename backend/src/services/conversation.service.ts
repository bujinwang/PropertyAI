import { PrismaClient, Message } from '@prisma/client';
import { sentimentService } from './sentiment.service';

const prisma = new PrismaClient();

export class ConversationService {
  async createMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string
  ): Promise<Message> {
    const sentiment = await sentimentService.analyze(content);
    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId: recipientId,
        content,
      },
    });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
    });
  }
}
