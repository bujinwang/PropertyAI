import { aiOrchestrationService } from './aiOrchestration.service';

class PropertyDescriptionService {
  async generateDescription(propertyData: any): Promise<string> {
    const prompt = `Generate a compelling property description for a property with the following details: ${JSON.stringify(
      propertyData,
    )}`;
    const workflow = { name: 'text-generation' };
    const result = await aiOrchestrationService.submitWorkflow(workflow, { prompt });
    return result.generatedText;
  }
}

export const propertyDescriptionService = new PropertyDescriptionService();
