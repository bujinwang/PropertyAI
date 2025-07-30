import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';

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
    return response;
  }
}

export default new SttService();
