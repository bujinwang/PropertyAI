import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

interface TranslationRequest {
  q: string;
  target: string;
  source?: string;
  format?: 'text' | 'html';
}

interface TranslationResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

class TranslationService {
  private readonly GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
  private readonly SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  private async getApiKey(): Promise<string> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key not configured');
    }
    return apiKey;
  }

  async translate(
    text: string, 
    targetLanguage: string, 
    sourceLanguage?: string
  ): Promise<{
    translatedText: string;
    detectedSourceLanguage?: string;
    confidence?: number;
  }> {
    try {
      const apiKey = await this.getApiKey();
      
      const request: TranslationRequest = {
        q: text,
        target: targetLanguage,
        format: 'text'
      };

      if (sourceLanguage) {
        request.source = sourceLanguage;
      }

      const response = await axios.post<TranslationResponse>(
        `${this.GOOGLE_TRANSLATE_API_URL}?key=${apiKey}`,
        request
      );

      const translation = response.data.data.translations[0];
      
      return {
        translatedText: translation.translatedText,
        detectedSourceLanguage: translation.detectedSourceLanguage,
        confidence: 0.95 // Google Translate doesn't provide confidence, so we use a high default
      };
    } catch (error: unknown) {
      console.error('Translation error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to translate text: ${error.message}`);
      }
      throw new Error('Failed to translate text: An unknown error occurred');
    }
  }

  async translateMultiple(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<Array<{
    originalText: string;
    translatedText: string;
    detectedSourceLanguage?: string;
  }>> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await axios.post<TranslationResponse>(
        `${this.GOOGLE_TRANSLATE_API_URL}?key=${apiKey}`,
        {
          q: texts,
          target: targetLanguage,
          source: sourceLanguage,
          format: 'text'
        }
      );

      return texts.map((originalText, index) => ({
        originalText,
        translatedText: response.data.data.translations[index]?.translatedText || originalText,
        detectedSourceLanguage: response.data.data.translations[index]?.detectedSourceLanguage
      }));
    } catch (error: unknown) {
      console.error('Bulk translation error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to translate multiple texts: ${error.message}`);
      }
      throw new Error('Failed to translate multiple texts: An unknown error occurred');
    }
  }

  async detectLanguage(text: string): Promise<{
    language: string;
    confidence: number;
    isReliable: boolean;
  }> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await axios.post(
        `${this.GOOGLE_TRANSLATE_API_URL}/detect?key=${apiKey}`,
        { q: text }
      );

      const detection = response.data.data.detections[0][0];
      
      return {
        language: detection.language,
        confidence: detection.confidence,
        isReliable: detection.isReliable
      };
    } catch (error: unknown) {
      console.error('Language detection error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to detect language: ${error.message}`);
      }
      throw new Error('Failed to detect language: An unknown error occurred');
    }
  }

  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return this.SUPPORTED_LANGUAGES;
  }

  async translateWithFallback(
    text: string,
    targetLanguage: string,
    fallbackLanguage = 'en'
  ): Promise<string> {
    try {
      const result = await this.translate(text, targetLanguage);
      return result.translatedText;
    } catch (error) {
      console.warn(`Translation to ${targetLanguage} failed, falling back to ${fallbackLanguage}`);
      
      try {
        const fallback = await this.translate(text, fallbackLanguage);
        return fallback.translatedText;
      } catch (fallbackError) {
        return text; // Return original text if all translations fail
      }
    }
  }

  async translatePropertyDescription(
    description: string,
    targetLanguages: string[]
  ): Promise<Record<string, string>> {
    const translations: Record<string, string> = {};
    
    for (const lang of targetLanguages) {
      try {
        const result = await this.translate(description, lang);
        translations[lang] = result.translatedText;
      } catch (error) {
        console.warn(`Failed to translate to ${lang}:`, error);
        translations[lang] = description; // Fallback to original
      }
    }
    
    return translations;
  }
}

export const translationService = new TranslationService();