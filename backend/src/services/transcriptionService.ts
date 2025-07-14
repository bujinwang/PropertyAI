import SttService from './sttService';
import { AIOrchestrationService } from './aiOrchestrationService';
import Transcription from '../models/mongo/Transcription';

class TranscriptionService {
  private aiOrchestrationService: AIOrchestrationService;

  constructor(aiOrchestrationService: AIOrchestrationService) {
    this.aiOrchestrationService = aiOrchestrationService;
  }

  async transcribe(filePath: string, voicemailId: string) {
    try {
      const transcriptionResult = await SttService.transcribe(filePath);
      const transcription = new Transcription({
        voicemailId,
        transcript: transcriptionResult,
        languageCode: 'en-US',
        confidence: 0.9, // This is a placeholder
        words: [], // This is a placeholder
        status: 'completed',
      });
      await transcription.save();
      return transcription;
    } catch (error: any) {
      console.error(`Error transcribing ${filePath}:`, error);
      const transcription = new Transcription({
        voicemailId,
        status: 'failed',
        errorMessage: error.message,
      });
      await transcription.save();
      throw error;
    }
  }
}

export default TranscriptionService;
