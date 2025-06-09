"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDocument = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const verifyDocument = async (document) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Verify the following document and extract key information:
  
  Document URL: ${document.url}
  Document Type: ${document.type}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const verification = response.text();
    return JSON.parse(verification);
};
exports.verifyDocument = verifyDocument;
//# sourceMappingURL=documentVerificationService.js.map