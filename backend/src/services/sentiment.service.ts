import { prisma } from '../config/database';
import { translationService } from './translation.service';
import { aiOrchestrationService } from './aiOrchestration.service';
import { Sentiment } from '@prisma/client';

class SentimentService {
  async analyze(text: string): Promise<Sentiment> {
    try {
      const translatedText = await translationService.translate(text, 'en');
      const prompt = `Analyze the sentiment of the following text and classify it as POSITIVE, NEGATIVE, or NEUTRAL. Text: "${translatedText}"`;
      const sentimentResult = await aiOrchestrationService.generateText(prompt);
      return sentimentResult.toUpperCase().trim() as Sentiment;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return Sentiment.NEUTRAL;
    }
  }

  async analyzeAndSaveSentiment(messageId: string, text: string): Promise<void> {
    try {
      const sentiment = await this.analyze(text);
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
