import { prisma } from '../config/database';
import { translationService } from './translation.service';
import { aiOrchestrationService } from './aiOrchestration.service';
type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

class SentimentService {
  /**
   * Analyse sentiment, DEGRADING to `NEUTRAL` on any failure.
   *
   * This is the historical behaviour and it is kept deliberately, because two
   * internal callers depend on it never throwing:
   *   - `triage.service` classifies a maintenance request; a vendor outage must
   *     not stop triage.
   *   - `conversation.service.createMessage` persists a message; a vendor outage
   *     must not reject the write.
   *
   * THE CONSEQUENCE, WHICH IS A REAL BUG:
   * a caller cannot distinguish "the model read this as neutral" from "we could
   * not reach the model at all". Both return the string `'NEUTRAL'`. For an
   * internal best-effort enrichment that is acceptable; for an HTTP endpoint
   * that reports a result to a user it is not, because a failure is presented as
   * a genuine finding.
   *
   * Use `tryAnalyze` when the distinction matters.
   */
  async analyze(text: string): Promise<Sentiment> {
    try {
      return await this.tryAnalyze(text);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 'NEUTRAL';
    }
  }

  /**
   * Analyse sentiment, PROPAGATING failure.
   *
   * Exists so the HTTP surface can answer honestly. Separated from `analyze`
   * rather than replacing it, because turning every existing caller into a
   * thrower would change triage and message-persistence behaviour as a side
   * effect of a controller fix.
   */
  async tryAnalyze(text: string): Promise<Sentiment> {
    const translatedText = await translationService.translate(text, 'en');
    const prompt = `Analyze the sentiment of the following text and classify it as POSITIVE, NEGATIVE, or NEUTRAL. Text: "${translatedText}"`;
    const sentimentResult = await aiOrchestrationService.generateText(prompt);
    return sentimentResult.toUpperCase().trim() as Sentiment;
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
