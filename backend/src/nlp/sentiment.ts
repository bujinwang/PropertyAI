export interface SentimentResult {
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export const analyzeSentiment = (text: string): SentimentResult => {
  // Basic sentiment analysis implementation
  // In a real application, you'd use a proper NLP library
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  const score = totalSentimentWords > 0 ? (positiveCount - negativeCount) / totalSentimentWords : 0;
  
  let sentiment: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) sentiment = 'positive';
  else if (score < -0.1) sentiment = 'negative';
  else sentiment = 'neutral';
  
  const confidence = totalSentimentWords > 0 ? Math.min(totalSentimentWords / words.length * 2, 1) : 0;
  
  return { score, sentiment, confidence };
};
