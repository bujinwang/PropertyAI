import { Document } from '@prisma/client';
import { generativeAIService } from './generativeAI.service';

export const verifyDocument = async (document: Document): Promise<any> => {
  const prompt = `Verify the following document and extract key information:
  
  Document URL: ${document.url}
  Document Type: ${document.type}`;

  const verification = await generativeAIService.generateText(prompt);
  return JSON.parse(verification);
};
