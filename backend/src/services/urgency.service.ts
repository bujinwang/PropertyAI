export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
}

export class UrgencyService {
  isUrgent(sentiment: Sentiment): boolean {
    return sentiment === 'NEGATIVE';
  }
}
