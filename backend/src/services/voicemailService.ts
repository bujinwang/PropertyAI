import fs from 'fs';
import path from 'path';
import { aiOrchestrationService } from './aiOrchestrationService';

class VoicemailService {
  private watchDir: string;

  constructor(watchDir: string) {
    this.watchDir = watchDir;
    this.initialize();
  }

  private initialize() {
    fs.watch(this.watchDir, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        const filePath = path.join(this.watchDir, filename);
        aiOrchestrationService.startTranscriptionWorkflow(filePath);
      }
    });
  }
}

export default VoicemailService;
