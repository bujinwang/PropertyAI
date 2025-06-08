import { SpeechClient } from '@google-cloud/speech';
import fs from 'fs';

class SttService {
  private client: SpeechClient;

  constructor() {
    this.client = new SpeechClient();
  }

  async transcribe(filePath: string) {
    const file = fs.readFileSync(filePath);
    const audioBytes = file.toString('base64');

    const audio = {
      content: audioBytes,
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

    const [response] = await this.client.recognize(request);
    const transcription =
      response.results
        ?.map((result) => result.alternatives?.[0]?.transcript)
        .join('\n') ?? '';
    return transcription;
  }
}

export default new SttService();
