import { Document } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const verifyDocument = async (document: Document): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Verify the following document and extract key information:
  
  Document URL: ${document.url}
  Document Type: ${document.type}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const verification = response.text();
  return JSON.parse(verification);
};
