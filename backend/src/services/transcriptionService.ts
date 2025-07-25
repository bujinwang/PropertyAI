import SttService from './sttService';
import { AiOrchestrationService } from './aiOrchestrationService';
import Transcription from '../models/mongo/Transcription';

class TranscriptionService {
  private aiOrchestrationService: AiOrchestrationService;

  constructor(aiOrchestrationService: AiOrchestrationService) {
    this.aiOrchestrationService = aiOrchestrationService;
  }

  async transcribe(filePath: string, voicemailId: string) {
    try {
      const transcriptionResult = await SttService.transcribe(filePath);
      const transcription = new Transcription({
        voicemailId,
        transcript:
          transcriptionResult.results
            ?.map((result) => result.alternatives?.[0]?.transcript)
            .join('\n') ?? '',
        languageCode: 'en-US',
        confidence:
          transcriptionResult.results?.[0]?.alternatives?.[0]?.confidence ?? 0,
        words:
          transcriptionResult.results?.[0]?.alternatives?.[0]?.words ?? [],
        status: 'completed',
      });
      await transcription.save();
      this.aiOrchestrationService.startTranscriptionWorkflow(filePath);
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
