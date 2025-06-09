import { aiOrchestrationService } from './aiOrchestration.service';

class PhotoEnhancementService {
  async enhancePhoto(imageData: Buffer): Promise<Buffer> {
    const workflow = { name: 'photo-enhancement' };
    const result = await aiOrchestrationService.submitWorkflow(workflow, { image: imageData });
    return result.processedImage;
  }
}

export const photoEnhancementService = new PhotoEnhancementService();
