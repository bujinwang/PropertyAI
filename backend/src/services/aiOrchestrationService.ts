class AiOrchestrationService {
  startTranscriptionWorkflow(filePath: string): void {
    console.log(`Starting transcription workflow for: ${filePath}`);
  }
}

export const aiOrchestrationService = new AiOrchestrationService();
