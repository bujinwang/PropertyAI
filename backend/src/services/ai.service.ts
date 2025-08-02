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
   * Analyze sentiment using Hugging Face models
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const result = await this.hfInference.textClassification({
        model: 'distilbert-base-uncased-finetuned-sst-2-english',
        inputs: text,
      });

      const prediction = result[0];
      const label = prediction.label.toUpperCase() as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      
      return {
        label,
        score: prediction.score,
      };
    } catch (error) {
      logger.error(`Error analyzing sentiment: ${error}`);
      
      // Fallback to basic sentiment analysis
      return this.basicSentimentAnalysis(text);
    }
  }

  /**
   * Extract entities from text
   */
  async extractEntities(text: string): Promise<EntityExtraction> {
    try {
      const result = await this.hfInference.tokenClassification({
        model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
        inputs: text,
      });

      const entities: Array<{ text: string; label: string | undefined; confidence: number; start: number; end: number; }> = result.map(entity => ({
        text: entity.word,
        label: entity.entity_group,
        confidence: entity.score,
        start: entity.start,
        end: entity.end,
      }));

      return { entities };
    } catch (error) {
      logger.error(`Error extracting entities: ${error}`);
      
      // Fallback to basic entity extraction
      return this.basicEntityExtraction(text);
    }
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
   * Analyze maintenance request
   */
  async analyzeMaintenanceRequest(request: {
    title: string;
    description: string;
    category?: string;
  }): Promise<{
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
    category: string;
    estimatedCost: number;
    keywords: string[];
    recommendedVendors: string[];
  }> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Analyze this maintenance request:
        Title: ${request.title}
        Description: ${request.description}
        
        Determine:
        1. Urgency level (LOW, MEDIUM, HIGH, EMERGENCY)
        2. Best category (plumbing, electrical, HVAC, etc.)
        3. Estimated cost range ($50-100, $100-500, $500-2000, $2000+)
        4. Key keywords
        5. Recommended vendor types
        
        Provide a JSON response with these fields: urgency, category, estimatedCost, keywords, recommendedVendors`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text());

      return jsonResponse;
    } catch (error) {
      logger.error(`Error analyzing maintenance request: ${error}`);
      
      // Fallback analysis
      return this.basicMaintenanceAnalysis(request);
    }
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
  async extractKeywords(text: string, maxKeywords: number = 10): Promise<string[]> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Extract the top ${maxKeywords} most important keywords from this text:\n\n${text}\n\nReturn as a comma-separated list:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const keywordsText = response.text();
      
      return keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } catch (error) {
      logger.error(`Error extracting keywords: ${error}`);
      
      // Fallback to basic keyword extraction
      return this.basicKeywordExtraction(text, maxKeywords);
    }
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