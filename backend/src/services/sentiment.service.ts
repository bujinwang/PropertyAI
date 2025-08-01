import { prisma } from '../config/database';
import { translationService } from './translation.service';
import { aiOrchestrationService } from './aiOrchestration.service';
type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

class SentimentService {
  async analyze(text: string): Promise<Sentiment> {
    try {
      const translatedText = await translationService.translate(text, 'en');
      const prompt = `Analyze the sentiment of the following text and classify it as POSITIVE, NEGATIVE, or NEUTRAL. Text: "${translatedText}"`;
      const sentimentResult = await aiOrchestrationService.generateText(prompt);
      return sentimentResult.toUpperCase().trim() as Sentiment;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 'NEUTRAL';
    }
  }

  async analyzeAndSaveSentiment(messageId: string, text: string): Promise<void> {
    try {
      const sentiment = await this.analyze(text);
      // Note: Message model doesn't have sentiment field
      // This would require schema migration to add sentiment column
      console.log(`Sentiment analysis for message ${messageId}: ${sentiment}`);
    } catch (error) {
      console.error('Error analyzing and saving sentiment:', error);
    }
  }
}

export const sentimentService = new SentimentService();
