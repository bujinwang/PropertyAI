import SttService from './sttService';

export class AIOrchestrationService {
  public startTranscriptionWorkflow(filePath: string) {
    console.log(`Starting transcription workflow for ${filePath}`);
    SttService.transcribe(filePath)
      .then((transcription) => {
        console.log(`Transcription for ${filePath}: ${transcription}`);
      })
      .catch((error) => {
        console.error(`Error transcribing ${filePath}:`, error);
      });
  }
}

export default new AIOrchestrationService();
