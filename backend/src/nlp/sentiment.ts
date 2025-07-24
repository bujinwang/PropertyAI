import axios from 'axios';

interface SentimentAnalysis {
  score: number;
  magnitude: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotional_tone: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

interface HuggingFaceResponse {
  label: string;
  score: number;
}

class SentimentAnalyzer {
  private readonly HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models';
  private readonly MODELS = {
    sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    emotion: 'j-hartmann/emotion-english-distilroberta-base',
    toxicity: 'martin-ha/toxic-comment-model'
  };

  private async getApiKey(): Promise<string> {
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) {
      throw new Error('Hugging Face API key not configured');
    }
    return apiKey;
  }

  private async callHuggingFaceAPI(
    model: string, 
    text: string
  ): Promise<HuggingFaceResponse[]> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await axios.post(
        `${this.HUGGING_FACE_API_URL}/${model}`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Hugging Face API error for model ${model}:`, error);
      throw new Error(`Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      // Get sentiment analysis
      const sentimentResult = await this.callHuggingFaceAPI(
        this.MODELS.sentiment, 
        text
      );

      // Get emotion analysis
      const emotionResult = await this.callHuggingFaceAPI(
        this.MODELS.emotion,
        text
      );

      // Map Hugging Face labels to our format
      const sentimentMap = {
        'positive': 'positive',
        'negative': 'negative',
        'neutral': 'neutral'
      };

      const topSentiment = sentimentResult[0];
      const topEmotion = emotionResult[0];

      // Calculate magnitude based on confidence scores
      const magnitude = Math.max(...sentimentResult.map(r => r.score));

      // Map emotion labels to our format
      const emotionMapping = {
        'joy': ['joy', 'happiness', 'excitement'],
        'sadness': ['sadness', 'grief', 'sorrow'],
        'anger': ['anger', 'annoyance', 'disapproval'],
        'fear': ['fear', 'nervousness', 'anxiety'],
        'surprise': ['surprise', 'amusement', 'curiosity']
      };

      const emotionalTone = {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0
      };

      // Assign emotion scores based on Hugging Face results
      emotionResult.forEach(result => {
        const emotion = result.label.toLowerCase();
        const score = result.score;
        
        Object.entries(emotionMapping).forEach(([target, sources]) => {
          if (sources.some(source => emotion.includes(source))) {
            emotionalTone[target as keyof typeof emotionalTone] = Math.max(
              emotionalTone[target as keyof typeof emotionalTone],
              score
            );
          }
        });
      });

      const mappedLabel = sentimentMap[topSentiment.label as keyof typeof sentimentMap];
      return {
        score: this.calculateSentimentScore(topSentiment.label, topSentiment.score),
        magnitude,
        label: mappedLabel || 'neutral',
        confidence: topSentiment.score,
        emotional_tone: emotionalTone
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      
      // Fallback to basic sentiment analysis
      return this.basicSentimentAnalysis(text);
    }
  }

  private calculateSentimentScore(label: string, confidence: number): number {
    switch (label.toLowerCase()) {
      case 'positive':
        return confidence;
      case 'negative':
        return -confidence;
      case 'neutral':
      default:
        return 0;
    }
  }

  private basicSentimentAnalysis(text: string): SentimentAnalysis {
    // Simple keyword-based fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'sad', 'frustrated'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
      if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
    });

    const totalKeywords = positiveCount + negativeCount;
    const score = totalKeywords > 0 ? (positiveCount - negativeCount) / totalKeywords : 0;
    const magnitude = totalKeywords / words.length;

    return {
      score,
      magnitude,
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(score),
      emotional_tone: {
        joy: positiveCount / words.length,
        sadness: negativeCount / words.length * 0.5,
        anger: negativeCount / words.length * 0.3,
        fear: 0,
        surprise: 0
      }
    };
  }

  async analyzeBulkSentiment(texts: string[]): Promise<SentimentAnalysis[]> {
    const results = await Promise.allSettled(
      texts.map(text => this.analyzeSentiment(text))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`Failed to analyze sentiment for text ${index}:`, result.reason);
        return this.basicSentimentAnalysis(texts[index]);
      }
    });
  }

  async analyzeTenantFeedback(feedback: string): Promise<{
    sentiment: SentimentAnalysis;
    urgency: 'low' | 'medium' | 'high';
    category: string;
    recommendedAction: string;
  }> {
    const sentiment = await this.analyzeSentiment(feedback);
    
    // Determine urgency based on sentiment and keywords
    let urgency: 'low' | 'medium' | 'high' = 'low';
    let category = 'general';
    
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical'];
    const maintenanceKeywords = ['broken', 'repair', 'fix', 'maintenance', 'issue'];
    const paymentKeywords = ['payment', 'rent', 'bill', 'due', 'charge'];

    const lowerText = feedback.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
      urgency = 'high';
    } else if (sentiment.score < -0.5) {
      urgency = 'medium';
    }

    if (maintenanceKeywords.some(keyword => lowerText.includes(keyword))) {
      category = 'maintenance';
    } else if (paymentKeywords.some(keyword => lowerText.includes(keyword))) {
      category = 'payment';
    }

    // Generate recommended action based on sentiment and category
    let recommendedAction = 'Review and respond to tenant feedback';
    
    if (sentiment.label === 'negative') {
      recommendedAction = 'Address tenant concerns promptly and follow up';
    } else if (urgency === 'high') {
      recommendedAction = 'Immediate response required - escalate if necessary';
    } else if (category === 'maintenance') {
      recommendedAction = 'Schedule maintenance inspection';
    }

    return {
      sentiment,
      urgency,
      category,
      recommendedAction
    };
  }
}

export const sentimentAnalyzer = new SentimentAnalyzer();
export const analyzeSentiment = sentimentAnalyzer.analyzeSentiment.bind(sentimentAnalyzer);