export interface SentimentResponse {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}
