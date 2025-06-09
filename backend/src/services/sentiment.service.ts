import { prisma } from '../config/database';
import { translationService } from './translation.service';
import aios from './aiOrchestrationService';
import { Prisma, Sentiment } from '@prisma/client';

class SentimentService {
  async analyzeAndSaveSentiment(messageId: string, text: string): Promise<void> {
    try {
      const translatedText = await translationService.translate(text, 'en');
      const response = await aios.completion({
        model: 'claude-3-opus-20240229',
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of the following text and classify it as POSITIVE, NEGATIVE, or NEUTRAL.',
          },
          {
            role: 'user',
            content: translatedText,
          },
        ],
      });

      const sentiment = response.choices[0].message.content.toUpperCase() as Sentiment;

      await prisma.message.update({
        where: { id: messageId },
        data: { sentiment },
      });
    } catch (error) {
      console.error('Error analyzing and saving sentiment:', error);
    }
  }
}

export const sentimentService = new SentimentService();
