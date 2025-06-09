import { prisma } from '../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

class KnowledgeBaseService {
  public async getSolutionForIssue(issue: string): Promise<string | null> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Provide a solution for the following issue: ${issue}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  }

  public async addKnowledgeBaseEntry(buildingId: string, issue: string, solution: string) {
    await prisma.knowledgeBase.create({
      data: {
        buildingId,
        issue,
        solution,
      },
    });
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
