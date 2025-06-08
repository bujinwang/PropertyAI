import KnowledgeBaseService from './knowledgeBaseService';
import natural from 'natural';

class SuggestionService {
  async getSuggestions(query: string) {
    const entries = await KnowledgeBaseService.getEntries();
    const suggestions = entries
      .map((entry: any) => {
        const score = this.calculateScore(query, entry.keywords);
        return { ...entry, score };
      })
      .filter((entry: any) => entry.score > 0.5)
      .sort((a: any, b: any) => b.score - a.score);

    return suggestions;
  }

  private calculateScore(query: string, keywords: string[]) {
    const tokenizer = new natural.WordTokenizer();
    const queryTokens = tokenizer.tokenize(query.toLowerCase());
    let maxScore = 0;

    for (const keyword of keywords) {
      const keywordTokens = tokenizer.tokenize(keyword.toLowerCase());
      for (const queryToken of queryTokens) {
        for (const keywordToken of keywordTokens) {
          const score = natural.JaroWinklerDistance(
            queryToken,
            keywordToken,
            {}
          );
          if (score > maxScore) {
            maxScore = score;
          }
        }
      }
    }

    return maxScore;
  }
}

export default new SuggestionService();
