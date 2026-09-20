import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';

class GenerativeAIService {
  private generativeAI: GoogleGenerativeAI | null = null;

  /**
   * Resolve the client lazily, on first use.
   *
   * The key check used to live in the constructor, and this module instantiates
   * the service at import time (`export const generativeAIService = new
   * GenerativeAIService()` below). A missing GEMINI_API_KEY therefore made
   * *importing the module* throw, which took down every suite that reaches it
   * transitively through `app` -> routes/index -> aiContentRoutes. In CI, where
   * `.env.example` carries no key, that silently stopped 12 suites from running
   * at all — including auth.test.ts and security-owasp.test.ts.
   *
   * Deferring the check to first use keeps the same error and the same message,
   * but no longer makes the module unloadable.
   */
  private getClient(): GoogleGenerativeAI {
    if (!this.generativeAI) {
      const apiKey = config.google.apiKey;
      if (!apiKey) {
        throw new Error('Gemini API key is not defined in the configuration.');
      }
      this.generativeAI = new GoogleGenerativeAI(apiKey);
    }
    return this.generativeAI;
  }

  async generateText(prompt: string): Promise<string> {
    const model = this.getClient().getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    const model = this.getClient().getGenerativeModel({ model: 'gemini-2.5-pro' });
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  }
}

export const generativeAIService = new GenerativeAIService();
