import { generativeAIService } from './generativeAI.service';

class PropertyDescriptionService {
  async generateDescription(propertyData: any): Promise<string> {
    const prompt = `Generate a compelling, SEO-optimized property description for a property with the following details: ${JSON.stringify(
      propertyData,
    )}. Include a catchy title and a detailed description that highlights the key features and benefits of the property.`;
    return generativeAIService.generateText(prompt);
  }
}

export const propertyDescriptionService = new PropertyDescriptionService();
