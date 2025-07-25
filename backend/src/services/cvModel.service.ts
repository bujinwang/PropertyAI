import { generativeAIService } from './generativeAI.service';

class CVModelService {
  async processImage(model: string, image: Buffer, params: any): Promise<Buffer> {
    const imageBase64 = image.toString('base64');
    const mimeType = params.mimeType || 'image/jpeg'; // Assuming mimeType is passed in params

    const prompt = `Analyze the image using the ${model} model with the following parameters: ${JSON.stringify(params)}.`;
    const result = await generativeAIService.analyzeImage(prompt, imageBase64, mimeType);

    // Assuming the result from generativeAIService.analyzeImage is a string that can be converted to a Buffer
    return Buffer.from(result);
  }
}

export const cvModelService = new CVModelService();
