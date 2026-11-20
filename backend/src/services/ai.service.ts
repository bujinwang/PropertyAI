import { GoogleGenerativeAI } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference';
import { prisma } from '../config/database';
import logger from '../utils/logger';

interface AIServiceConfig {
  googleApiKey: string;
  huggingFaceApiKey: string;
  modelConfig: {
    maxTokens: number;
    temperature: number;
    topP: number;
  };
}

interface NLPRequest {
  text: string;
  context?: string;
  language?: string;
  maxLength?: number;
}

interface NLPResponse {
  text: string;
  confidence: number;
  metadata?: Record<string, any>;
}

interface SentimentAnalysis {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
}

interface EntityExtraction {
  entities: Array<{
    text: string;
    label: string | undefined;
    confidence: number;
    start: number;
    end: number;
  }>;
}

/**
 * The contract for maintenance analysis, declared ONCE.
 *
 * Both `analyzeMaintenanceRequest` (degrading) and
 * `tryAnalyzeMaintenanceRequest` (throwing) return this, so the two variants
 * cannot drift apart. `estimatedCost` is a `number` and `urgency` is a union —
 * both were previously asserted to callers without ever being enforced, because
 * they came straight off `JSON.parse` (`any`) and `tsc` cannot see through that.
 */
export interface MaintenanceAnalysis {
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  category: string;
  estimatedCost: number;
  keywords: string[];
  recommendedVendors: string[];
}

interface SummaryRequest {
  text: string;
  maxLength?: number;
  minLength?: number;
}

interface ClassificationRequest {
  text: string;
  labels: string[];
}

interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}

interface ChatResponse {
  message: string;
  conversationId: string;
  metadata?: Record<string, any>;
}

class AIService {
  private googleAI: GoogleGenerativeAI;
  private hfInference: HfInference;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.googleAI = new GoogleGenerativeAI(config.googleApiKey);
    this.hfInference = new HfInference(config.huggingFaceApiKey);
  }

  /**
   * Generate text using Google Gemini
   */
  async generateText(request: NLPRequest): Promise<NLPResponse> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = this.buildPrompt(request);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        confidence: 0.85, // Placeholder confidence score
        metadata: {
          model: 'gemini-pro',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(`Error generating text with Gemini: ${error}`);
      throw new Error('Failed to generate text');
    }
  }

  /**
   * Analyze sentiment using Hugging Face models, DEGRADING to a keyword count.
   *
   * THE CONSEQUENCE, WHICH IS A REAL BUG: `basicSentimentAnalysis` counts
   * positive/negative words. On a vendor outage it returns
   * `{ label: 'NEUTRAL', score: 0.5 }` for *any* input — so an outage on a
   * strongly negative message is reported as "no sentiment". A caller cannot
   * tell the two apart, and the HTTP route reported it as `{ success: true }`.
   *
   * Use `tryAnalyzeSentiment` when the distinction matters.
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      return await this.tryAnalyzeSentiment(text);
    } catch (error) {
      logger.error(`Error analyzing sentiment: ${error}`);

      // Documented, deliberate degradation for best-effort enrichment.
      return this.basicSentimentAnalysis(text);
    }
  }

  /**
   * Analyze sentiment, PROPAGATING failure.
   *
   * Exists so `/api/ai/sentiment` can answer honestly instead of presenting a
   * word count as a model verdict. Mirrors `sentimentService.tryAnalyze`.
   */
  async tryAnalyzeSentiment(text: string): Promise<SentimentAnalysis> {
    const result = await this.hfInference.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: text,
    });

    const prediction = result[0];
    if (!prediction) {
      throw new Error('Sentiment model returned no prediction');
    }

    return {
      label: prediction.label.toUpperCase() as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
      score: prediction.score,
    };
  }

  /**
   * Extract entities from text
   */
  /**
   * Extract entities, DEGRADING to a regex sweep.
   *
   * `basicEntityExtraction` matches five hardcoded patterns at confidence 0.6.
   * On a vendor outage every real entity it fails to match is silently absent
   * and every match is presented with an invented confidence — indistinguishable
   * from a model result.
   *
   * Use `tryExtractEntities` when the distinction matters.
   */
  async extractEntities(text: string): Promise<EntityExtraction> {
    try {
      return await this.tryExtractEntities(text);
    } catch (error) {
      logger.error(`Error extracting entities: ${error}`);

      // Documented, deliberate degradation for best-effort enrichment.
      return this.basicEntityExtraction(text);
    }
  }

  /**
   * Extract entities, PROPAGATING failure.
   */
  async tryExtractEntities(text: string): Promise<EntityExtraction> {
    const result = await this.hfInference.tokenClassification({
      model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
      inputs: text,
    });

    const entities = result.map(entity => ({
      text: entity.word,
      label: entity.entity_group,
      confidence: entity.score,
      start: entity.start,
      end: entity.end,
    }));

    return { entities };
  }

  /**
   * Generate summary using Google Gemini
   */
  async generateSummary(request: SummaryRequest): Promise<NLPResponse> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Summarize the following text in ${request.maxLength || 150} characters or less:\n\n${request.text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        confidence: 0.8,
        metadata: {
          originalLength: request.text.length,
          summaryLength: text.length,
          compressionRatio: (text.length / request.text.length).toFixed(2),
        },
      };
    } catch (error) {
      logger.error(`Error generating summary: ${error}`);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Classify text into categories
   */
  async classifyText(request: ClassificationRequest): Promise<NLPResponse> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Classify the following text into one of these categories: ${request.labels.join(', ')}\n\nText: ${request.text}\n\nCategory:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const classification = response.text().trim();

      // Find the closest matching category
      const normalizedClassification = classification.toLowerCase();
      const matchingLabel = request.labels.find(label => 
        normalizedClassification.includes(label.toLowerCase()) || 
        label.toLowerCase().includes(normalizedClassification)
      ) || request.labels[0];

      return {
        text: matchingLabel,
        confidence: 0.75,
        metadata: {
          predicted: classification,
          labels: request.labels,
        },
      };
    } catch (error) {
      logger.error(`Error classifying text: ${error}`);
      throw new Error('Failed to classify text');
    }
  }

  /**
   * Chat with AI assistant
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Build context-aware prompt
      let prompt = request.message;
      if (request.context) {
        const contextStr = Object.entries(request.context)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        prompt = `Context:\n${contextStr}\n\nUser: ${request.message}\n\nAssistant:`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const message = response.text();

      // Save conversation to database
      const conversationId = request.conversationId || uuidv4();
      // Save user message
      await prisma.message.create({
        data: {
          conversationId,
          senderId: 'system', // Assuming 'system' as sender for AI messages, adjust as needed
          receiverId: 'user', // Assuming 'user' as recipient, adjust as needed
          content: request.message,
        },
      });
      // Save AI message
      await prisma.message.create({
        data: {
          conversationId,
          senderId: 'user', // Assuming 'user' as sender for user messages, adjust as needed
          receiverId: 'system', // Assuming 'system' as recipient, adjust as needed
          content: message,
        },
      });

      return {
        message,
        conversationId,
        metadata: {
          timestamp: new Date().toISOString(),
          model: 'gemini-pro',
        },
      };
    } catch (error) {
      logger.error(`Error in chat: ${error}`);
      throw new Error('Failed to process chat request');
    }
  }

  /**
   * Generate property description
   */
  async generatePropertyDescription(propertyData: {
    type: string;
    bedrooms: number;
    bathrooms: number;
    location: string;
    amenities: string[];
    price: number;
  }): Promise<NLPResponse> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Generate an engaging property description for a ${propertyData.bedrooms} bedroom, ${propertyData.bathrooms} bathroom ${propertyData.type} in ${propertyData.location}. 
        Price: $${propertyData.price}
        Amenities: ${propertyData.amenities.join(', ')}
        
        Make it professional, appealing, and include key selling points.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        confidence: 0.9,
        metadata: {
          type: 'property-description',
          propertyType: propertyData.type,
          location: propertyData.location,
        },
      };
    } catch (error) {
      logger.error(`Error generating property description: ${error}`);
      throw new Error('Failed to generate property description');
    }
  }

  /**
   * Analyze a maintenance request, DEGRADING to a keyword grep on any failure.
   *
   * This is the historical behaviour and it is kept deliberately, because
   * internal callers may not want triage to stop when the vendor is down.
   *
   * THE CONSEQUENCE, WHICH WAS A REAL BUG:
   * `basicMaintenanceAnalysis` is not a model — it is a substring match. For any
   * text containing "broken" it returns `urgency: 'EMERGENCY'` and
   * `estimatedCost: 2000`. A caller could not distinguish "the model judged this
   * an emergency" from "we never reached the model", because both arrived as a
   * successful result. The HTTP route reported it to users as AI analysis.
   *
   * Use `tryAnalyzeMaintenanceRequest` when the distinction matters.
   */
  async analyzeMaintenanceRequest(request: {
    title: string;
    description: string;
    category?: string;
  }): Promise<MaintenanceAnalysis> {
    try {
      return await this.tryAnalyzeMaintenanceRequest(request);
    } catch (error) {
      logger.error(`Error analyzing maintenance request: ${error}`);

      // Documented, deliberate degradation. Callers that must know the
      // difference call the try-variant instead.
      return this.basicMaintenanceAnalysis(request);
    }
  }

  /**
   * Analyze a maintenance request, PROPAGATING failure.
   *
   * Exists so the HTTP surface can answer honestly instead of presenting a
   * keyword match as a model verdict. Separated from
   * `analyzeMaintenanceRequest` rather than replacing it, because turning a
   * never-throw method into a thrower would change every internal caller's
   * failure mode as a side effect of fixing one route.
   *
   * THREE BUGS THIS FIXES, all of which produced a fabricated success:
   *
   * 1. `JSON.parse(response.text())` with NO `responseMimeType` set. Asked for
   *    JSON, Gemini routinely answers inside a markdown fence, `JSON.parse`
   *    throws on the backtick, and the throw landed in the old `catch` — so the
   *    fake was the NORMAL path, not an edge case. Fixed at the root by
   *    requesting JSON mode, and defensively by stripping a fence if one still
   *    appears.
   * 2. The declared return type said `estimatedCost: number` while the prompt
   *    asked for a cost RANGE ("$100-500"). `JSON.parse` returns `any`, so
   *    nothing checked: one branch produced a string, the other a number, both
   *    behind a `number` annotation. Anything doing arithmetic got `NaN`.
   * 3. `urgency` was never validated against its union, so "HIGH PRIORITY"
   *    escaped the declared type at runtime.
   */
  async tryAnalyzeMaintenanceRequest(request: {
    title: string;
    description: string;
    category?: string;
  }): Promise<MaintenanceAnalysis> {
    const model = this.googleAI.getGenerativeModel({
      model: 'gemini-pro',
      // Root-cause fix for bug 1: ask for JSON instead of hoping for it.
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `Analyze this maintenance request:
        Title: ${request.title}
        Description: ${request.description}

        Determine:
        1. Urgency level — exactly one of: LOW, MEDIUM, HIGH, EMERGENCY
        2. Best category (plumbing, electrical, HVAC, etc.)
        3. Estimated cost as a SINGLE whole-dollar number (no range, no currency symbol)
        4. Key keywords
        5. Recommended vendor types

        Respond with JSON only, using these keys: urgency, category, estimatedCost, keywords, recommendedVendors`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const raw = response.text();

    return this.normalizeMaintenanceAnalysis(raw);
  }

  /**
   * Turn raw model output into the declared contract, or throw.
   *
   * Every field is validated rather than trusted, because the declared types are
   * asserted to callers and `JSON.parse` erases all of them.
   *
   * A range is reduced to its MIDPOINT: the prompt asks for a point estimate, so
   * a range is a compliance failure by the model, and the midpoint is the
   * standard single-point reduction of an uncertain interval. Documented here
   * because picking a bound instead would be an arbitrary tie-break.
   */
  private normalizeMaintenanceAnalysis(raw: string): MaintenanceAnalysis {
    const jsonText = this.stripCodeFence(raw);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      // Unusable output must fail loudly. Returning a partial object here would
      // recreate the bug this method exists to fix.
      throw new Error('AI returned unstructured output for maintenance analysis');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('AI returned a non-object for maintenance analysis');
    }

    // --- urgency: must land inside the declared union -----------------------
    const rawUrgency = String(parsed.urgency ?? '').toUpperCase().trim();
    const URGENCIES = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const;
    let urgency: MaintenanceAnalysis['urgency'];
    if ((URGENCIES as readonly string[]).includes(rawUrgency)) {
      urgency = rawUrgency as MaintenanceAnalysis['urgency'];
    } else if (rawUrgency.includes('EMERGENCY')) {
      urgency = 'EMERGENCY';
    } else if (rawUrgency.includes('HIGH')) {
      urgency = 'HIGH';
    } else if (rawUrgency.includes('MEDIUM') || rawUrgency.includes('MODERATE')) {
      urgency = 'MEDIUM';
    } else if (rawUrgency.includes('LOW')) {
      urgency = 'LOW';
    } else {
      throw new Error('AI returned an unrecognised urgency for maintenance analysis');
    }

    // --- estimatedCost: must be a finite number ------------------------------
    const estimatedCost = this.parseCostToNumber(parsed.estimatedCost);
    if (!Number.isFinite(estimatedCost)) {
      throw new Error('AI returned a non-numeric cost for maintenance analysis');
    }

    const category =
      typeof parsed.category === 'string' && parsed.category.trim()
        ? parsed.category.trim()
        : 'General';

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k: unknown) => typeof k === 'string')
      : [];

    const recommendedVendors = Array.isArray(parsed.recommendedVendors)
      ? parsed.recommendedVendors.filter((v: unknown) => typeof v === 'string')
      : [];

    return { urgency, category, estimatedCost, keywords, recommendedVendors };
  }

  /**
   * Strip a markdown code fence, if present.
   *
   * `responseMimeType: 'application/json'` should make this unnecessary, but the
   * SDK/model combination does not guarantee it, and the previous behaviour —
   * throwing straight into a fabricating `catch` — is too costly to leave to a
   * guarantee we cannot enforce locally.
   */
  private stripCodeFence(text: string): string {
    const trimmed = String(text ?? '').trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenced ? fenced[1].trim() : trimmed;
  }

  /**
   * Extract a finite dollar figure from whatever the model produced.
   *
   * Handles `350`, `"350"`, `"$350"`, `"$100-500"` (midpoint), `"$2,000"`.
   * Returns `NaN` when there is no number, so the caller can reject it.
   */
  private parseCostToNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string') return NaN;

    const numbers = value
      .replace(/,/g, '')
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number)
      .filter((n) => Number.isFinite(n));

    if (!numbers || numbers.length === 0) return NaN;
    if (numbers.length === 1) return numbers[0];
    // A range: reduce to the midpoint of the first two figures.
    return (numbers[0] + numbers[1]) / 2;
  }

  /**
   * Generate lease agreement summary
   */
  async generateLeaseSummary(leaseText: string): Promise<NLPResponse> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Summarize this lease agreement in plain English, highlighting key terms, rent amount, duration, and important clauses:\n\n${leaseText}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        confidence: 0.85,
        metadata: {
          type: 'lease-summary',
          originalLength: leaseText.length,
        },
      };
    } catch (error) {
      logger.error(`Error generating lease summary: ${error}`);
      throw new Error('Failed to generate lease summary');
    }
  }

  /**
   * Translate text
   */
  async translateText(text: string, targetLanguage: string): Promise<NLPResponse> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text();

      return {
        text: translatedText,
        confidence: 0.9,
        metadata: {
          sourceLanguage: 'auto-detected',
          targetLanguage,
          originalLength: text.length,
        },
      };
    } catch (error) {
      logger.error(`Error translating text: ${error}`);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Extract keywords from text
   */
  /**
   * Extract keywords, DEGRADING to word frequency.
   *
   * THE CONSEQUENCE: `basicKeywordExtraction` ranks tokens by count, so it
   * returns the most REPEATED words, not the most IMPORTANT ones, and it cannot
   * produce a multi-word keyphrase at all. On an outage the caller receives a
   * plausible list that is answering a different question, presented as a model
   * result.
   *
   * Use `tryExtractKeywords` when the distinction matters.
   */
  async extractKeywords(text: string, maxKeywords: number = 10): Promise<string[]> {
    try {
      return await this.tryExtractKeywords(text, maxKeywords);
    } catch (error) {
      logger.error(`Error extracting keywords: ${error}`);

      // Documented, deliberate degradation for best-effort enrichment.
      return this.basicKeywordExtraction(text, maxKeywords);
    }
  }

  /**
   * Extract keywords, PROPAGATING failure.
   */
  async tryExtractKeywords(text: string, maxKeywords: number = 10): Promise<string[]> {
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Extract the top ${maxKeywords} most important keywords from this text:\n\n${text}\n\nReturn as a comma-separated list:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const keywordsText = response.text();

    return keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  // Private helper methods
  private buildPrompt(request: NLPRequest): string {
    let prompt = request.text;
    if (request.context) {
      prompt = `Context: ${request.context}\n\n${request.text}`;
    }
    return prompt;
  }

  private basicSentimentAnalysis(text: string): SentimentAnalysis {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'disappointed', 'angry'];
    
    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) {
      return { label: 'POSITIVE', score: 0.7 };
    } else if (negativeScore > positiveScore) {
      return { label: 'NEGATIVE', score: 0.7 };
    } else {
      return { label: 'NEUTRAL', score: 0.5 };
    }
  }

  private basicEntityExtraction(text: string): EntityExtraction {
    const entities: Array<{ text: string; label: string; confidence: number; start: number; end: number; }> = [];
    const patterns = {
      PERSON: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      ORG: /\b[A-Z][a-z]+ (Inc|Corp|LLC|Company)\b/g,
      LOCATION: /\b[A-Z][a-z]+, [A-Z]{2}\b/g,
      DATE: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      MONEY: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
    };

    Object.entries(patterns).forEach(([label, pattern]) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          label,
          confidence: 0.6,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    });

    return { entities };
  }

  private basicMaintenanceAnalysis(request: { title: string; description: string }) {
    const urgentKeywords = ['emergency', 'urgent', 'broken', 'leak', 'flood', 'fire', 'electrical'];
    const mediumKeywords = ['repair', 'fix', 'issue', 'problem', 'broken'];
    
    const combinedText = `${request.title} ${request.description}`.toLowerCase();
    
    let urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' = 'LOW';
    let estimatedCost = 100;
    
    if (urgentKeywords.some(keyword => combinedText.includes(keyword))) {
      urgency = 'EMERGENCY';
      estimatedCost = 2000;
    } else if (mediumKeywords.some(keyword => combinedText.includes(keyword))) {
      urgency = 'MEDIUM';
      estimatedCost = 500;
    }

    return {
      urgency,
      category: 'General',
      estimatedCost,
      keywords: combinedText.split(' ').filter(w => w.length > 3),
      recommendedVendors: ['General Contractor', 'Handyman'],
    };
  }

  private basicKeywordExtraction(text: string, maxKeywords: number): string[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      if (word.length > 3 && !this.isStopWord(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
    return stopWords.includes(word);
  }

  private async saveConversation(
    conversationId: string,
    userMessage: string,
    aiMessage: string,
    context?: Record<string, any>
  ): Promise<void> {
    // This function is no longer needed as conversation saving is handled directly in the chat method.
    // Keeping it as a placeholder or for future reference if needed.
  }
}

import { v4 as uuidv4 } from 'uuid';

// Initialize AI service
const aiService = new AIService({
  googleApiKey: process.env.GOOGLE_GEMINI_API_KEY!,
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY!,
  modelConfig: {
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.8,
  },
});

export { aiService, AIService };
export type {
  NLPRequest,
  NLPResponse,
  SentimentAnalysis,
  EntityExtraction,
  SummaryRequest,
  ClassificationRequest,
  ChatRequest,
  ChatResponse,
};