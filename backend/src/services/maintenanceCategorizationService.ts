import { generativeAIService } from './generativeAI.service';

class MaintenanceCategorizationService {
  async categorize(text: string, image?: Buffer): Promise<{ urgency: string; type: string }> {
    const prompt = `Categorize the following maintenance request and determine its urgency.
      Request: ${text}
      Urgency levels: Low, Medium, High, Emergency
      Categories: Plumbing, Electrical, HVAC, Carpentry, Painting, Other`;

    if (image) {
      const imageBase64 = image.toString('base64');
      const result = await generativeAIService.analyzeImage(prompt, imageBase64, 'image/jpeg');
      const [urgency, type] = result.split(',').map((item) => item.trim());
      return { urgency, type };
    } else {
      const result = await generativeAIService.generateText(prompt);
      const [urgency, type] = result.split(',').map((item) => item.trim());
      return { urgency, type };
    }
  }
}

export default new MaintenanceCategorizationService();
