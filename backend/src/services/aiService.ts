import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generatePropertyDescription = async (photos: string[], details: any): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Generate a compelling property description based on the following details and photos:
  
  Details: ${JSON.stringify(details, null, 2)}
  
  Photos: ${photos.join(', ')}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
};

export const assessApplicantRisk = async (applicantData: any): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Assess the risk of the following tenant applicant and provide a risk score and a summary of the reasons:
  
  Applicant Data: ${JSON.stringify(applicantData, null, 2)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const assessment = response.text();
  return JSON.parse(assessment);
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Translate the following text to ${targetLanguage}:
  
  Text: ${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const translatedText = response.text();
  return translatedText;
};

export const analyzeSentiment = async (text: string): Promise<{ score: number; label: string }> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Analyze the sentiment of the following text and return a score and a label (positive, negative, neutral):
  
  Text: ${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const sentiment = response.text();
  return JSON.parse(sentiment);
};

export const generateFollowUp = async (conversation: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Generate a follow-up message based on the following conversation:
  
  Conversation: ${conversation}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
};

export const generatePriceRecommendation = async (listing: any): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Generate a price recommendation for the following listing:
  
  ${JSON.stringify(listing, null, 2)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return JSON.parse(text);
};

export const generateSmartResponse = async (message: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Generate a smart response suggestion for the following message:
  
  Message: ${message}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
};

export const generateImageAnalysis = async (imageUrl: string): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Analyze the following image and provide a description and tags: ${imageUrl}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return JSON.parse(text);
};
