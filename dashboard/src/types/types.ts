export interface SentimentResponse {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

// Re-export AI types for convenience
export * from './ai';

// Re-export risk assessment types for convenience
export * from './risk-assessment';
