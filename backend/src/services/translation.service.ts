import aios from './aiOrchestrationService';

class TranslationService {
  async translate(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await aios.completion({
        model: 'claude-3-opus-20240229',
        messages: [
          {
            role: 'system',
            content: `Translate the following text to ${targetLanguage}.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error translating text:', error);
      throw new Error('Failed to translate text');
    }
  }
}

export const translationService = new TranslationService();
