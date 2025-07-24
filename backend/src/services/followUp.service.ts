import { prisma } from '../config/database';
import { translationService } from './translation.service';
import { aiOrchestrationService } from './aiOrchestrationService';
import { Prisma, FollowUp } from '@prisma/client';

class FollowUpService {
  async scheduleFollowUp(messageId: string, followUpAt: Date): Promise<FollowUp> {
    return prisma.followUp.create({
      data: {
        messageId,
        status: 'SCHEDULED',
        followUpAt,
      },
    });
  }

  async getFollowUps(): Promise<FollowUp[]> {
    return prisma.followUp.findMany({
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

  async sendFollowUp(followUp: FollowUp): Promise<void> {
    try {
      const { messageId } = followUp;
      const message = await prisma.message.findUnique({ where: { id: messageId }, include: { sender: true } });
      if (!message) {
        throw new Error('Message not found');
      }
      const translatedText = await translationService.translate(message.content, 'en');
      const followUpMessage = `This is a follow-up to your message: "${message.content}"`;

      // Here you would typically send the follow-up message via email, SMS, etc.
      console.log(`Sending follow-up message to ${message.sender.email}: ${followUpMessage}`);

      await prisma.followUp.update({
        where: { id: followUp.id },
        data: { status: 'SENT' },
      });
    } catch (error) {
      console.error('Error sending follow-up:', error);
    }
  }
}

export const followUpService = new FollowUpService();
