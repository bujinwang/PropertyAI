import { SpeechClient } from '@google-cloud/speech';
import { config } from '../config/config';

class SpeechToTextService {
  private speechClient: SpeechClient;

  constructor() {
    this.speechClient = new SpeechClient({
      credentials: {
        client_email: config.google.clientEmail,
        private_key: config.google.privateKey,
      },
      projectId: config.google.projectId,
    });
  }

  async transcribeAudio(audioBase64: string, encoding: any, sampleRateHertz: number, languageCode: string): Promise<string> {
    const audio = {
      content: audioBase64,
    };
    const request = {
      audio: audio,
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
      },
    };
    const [response] = await this.speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n');
    return transcription ?? '';
  }
}

export const speechToTextService = new SpeechToTextService();
