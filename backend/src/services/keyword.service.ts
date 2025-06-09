class KeywordService {
  async getKeywords(propertyData: any): Promise<string[]> {
    // This is a mock implementation.
    // In a real implementation, this would use a keyword research tool to find relevant keywords.
    console.log('Getting keywords for:', propertyData);
    const keywords = [
      `property in ${propertyData.location}`,
      `${propertyData.bedrooms} bedroom apartment in ${propertyData.location}`,
      `buy property in ${propertyData.location}`,
      `rent property in ${propertyData.location}`,
    ];
    return keywords;
  }
}

export const keywordService = new KeywordService();
