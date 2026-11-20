import { Message } from '@prisma/client';
import { prisma } from '../config/database';
import { sentimentService } from './sentiment.service';

/**
 * KNOWN GAP — READ BEFORE WIRING THIS UP
 * --------------------------------------
 * `createMessage` has no callers anywhere in the codebase, and this class is
 * therefore dead code. It is left in place (rather than deleted) because the
 * bug it contained is instructive and the fix is now correct:
 *
 * It used to call `sentimentService.analyze(content)`, assign the result to a
 * local `sentiment`, and then NOT pass it to `prisma.message.create`. The value
 * was computed — an AI call, a Google Translate call — and thrown away. Those
 * are the `Message.sentiment` / `sentimentScore` / `category` /
 * `isEarlyWarning` columns that `/api/tenant/*` analytics reads.
 *
 * Consequently: NOTHING in this backend writes those four columns. The four
 * analytics endpoints are therefore well-scoped (see
 * `controllers/tenantAnalyticsController.ts`) but structurally empty — they can
 * only ever report on rows inserted by hand. That is a missing feature, not an
 * authorization bug, and it is recorded rather than papered over.
 *
 * Two things must be true before this function is wired up:
 *   1. `sentiment` must actually be persisted (done below).
 *   2. `sentimentScore` needs a producer — `sentimentService.analyze` returns a
 *      bare enum with no numeric score, so `sentimentScore` stays null and
 *      every score-based threshold in `getEarlyWarnings` (`< -0.5`) and
 *      `getProactiveSuggestions` (`< -0.3`) can never fire.
 */
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
        // Previously computed and discarded. Without this the analytics
        // endpoint sees a message whose sentiment is the schema DEFAULT
        // (`NEUTRAL`), not the real classification.
        sentiment,
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
