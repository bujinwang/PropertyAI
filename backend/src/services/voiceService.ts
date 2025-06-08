import { SpeechClient } from '@google-cloud/speech';
import { AppError } from '../middleware/errorMiddleware';

const speechClient = new SpeechClient();

export const convertVoiceToText = async (audioBuffer: Buffer): Promise<string> => {
  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n');
    return transcription || '';
  } catch (error) {
    throw new AppError('Failed to convert voice to text', 500);
  }
};
