class TranslationService {
  async translate(text: string, targetLanguage: string): Promise<string> {
    throw new Error('Translation service not implemented');
  }
}

export const translationService = new TranslationService();