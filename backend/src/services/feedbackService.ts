import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FeedbackService {
  async createFeedback(
    requestId: string,
    isCorrect: boolean,
    correctedUrgency?: string,
    correctedType?: string
  ) {
    // This is a placeholder for the actual implementation
    console.log(
      `Feedback received for request ${requestId}: ${
        isCorrect ? 'correct' : 'incorrect'
      }`
    );
    if (!isCorrect) {
      console.log(
        `Corrected urgency: ${correctedUrgency}, corrected type: ${correctedType}`
      );
    }
  }
}

export default new FeedbackService();
