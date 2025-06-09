"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImageAnalysis = exports.generateSmartResponse = exports.generatePriceRecommendation = exports.generateFollowUp = exports.analyzeSentiment = exports.translateText = exports.assessApplicantRisk = exports.generatePropertyDescription = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const generatePropertyDescription = async (photos, details) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Generate a compelling property description based on the following details and photos:
  
  Details: ${JSON.stringify(details, null, 2)}
  
  Photos: ${photos.join(', ')}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
};
exports.generatePropertyDescription = generatePropertyDescription;
const assessApplicantRisk = async (applicantData) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Assess the risk of the following tenant applicant and provide a risk score and a summary of the reasons:
  
  Applicant Data: ${JSON.stringify(applicantData, null, 2)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const assessment = response.text();
    return JSON.parse(assessment);
};
exports.assessApplicantRisk = assessApplicantRisk;
const translateText = async (text, targetLanguage) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Translate the following text to ${targetLanguage}:
  
  Text: ${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();
    return translatedText;
};
exports.translateText = translateText;
const analyzeSentiment = async (text) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Analyze the sentiment of the following text and return a score and a label (positive, negative, neutral):
  
  Text: ${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sentiment = response.text();
    return JSON.parse(sentiment);
};
exports.analyzeSentiment = analyzeSentiment;
const generateFollowUp = async (conversation) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Generate a follow-up message based on the following conversation:
  
  Conversation: ${conversation}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
};
exports.generateFollowUp = generateFollowUp;
const generatePriceRecommendation = async (listing) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Generate a price recommendation for the following listing:
  
  ${JSON.stringify(listing, null, 2)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
};
exports.generatePriceRecommendation = generatePriceRecommendation;
const generateSmartResponse = async (message) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Generate a smart response suggestion for the following message:
  
  Message: ${message}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
};
exports.generateSmartResponse = generateSmartResponse;
const generateImageAnalysis = async (imageUrl) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Analyze the following image and provide a description and tags: ${imageUrl}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
};
exports.generateImageAnalysis = generateImageAnalysis;
//# sourceMappingURL=aiService.js.map