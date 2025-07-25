import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';

class GenerativeAIService {
  private generativeAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = config.google.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key is not defined in the configuration.');
    }
    this.generativeAI = new GoogleGenerativeAI(apiKey);
  }

  async generateText(prompt: string): Promise<string> {
    const model = this.generativeAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    const model = this.generativeAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
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
