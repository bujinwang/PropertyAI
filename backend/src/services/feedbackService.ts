import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FeedbackService {
  async createFeedback(
    requestId: string,
    isCorrect: boolean,
    correctedUrgency?: string,
    correctedType?: string
  ) {
    await prisma.feedback.create({
      data: {
        requestId,
        isCorrect,
        correctedUrgency,
        correctedType,
      },
    });
  }
}

export default new FeedbackService();
