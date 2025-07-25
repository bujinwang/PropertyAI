import { generativeAIService } from './generativeAI.service';

class KeywordService {
  async getKeywords(propertyData: any): Promise<string[]> {
    const prompt = `Generate a list of relevant keywords for a property with the following details:
      Location: ${propertyData.location}
      Bedrooms: ${propertyData.bedrooms}
      Property Type: ${propertyData.propertyType}
      Amenities: ${propertyData.amenities.join(', ')}

      The keywords should be suitable for use in online advertising and search engine optimization.`;

    const result = await generativeAIService.generateText(prompt);
    return result.split('\n').map((keyword) => keyword.trim());
  }
}

export const keywordService = new KeywordService();
