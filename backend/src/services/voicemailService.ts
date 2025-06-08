import fs from 'fs';
import path from 'path';
import { AIOrchestrationService } from './aiOrchestrationService';

class VoicemailService {
  private watchDir: string;
  private aiOrchestrationService: AIOrchestrationService;

  constructor(watchDir: string, aiOrchestrationService: AIOrchestrationService) {
    this.watchDir = watchDir;
    this.aiOrchestrationService = aiOrchestrationService;
    this.initialize();
  }

  private initialize() {
    fs.watch(this.watchDir, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        const filePath = path.join(this.watchDir, filename);
        this.aiOrchestrationService.startTranscriptionWorkflow(filePath);
      }
    });
  }
}

export default VoicemailService;
