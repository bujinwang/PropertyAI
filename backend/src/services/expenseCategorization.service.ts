import { prisma } from '../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

class ExpenseCategorizationService {
  public async categorizeExpense(transactionId: string): Promise<string | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Categorize the following expense for tax purposes: "${transaction.description}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text();

    return category;
  }
}

export const expenseCategorizationService = new ExpenseCategorizationService();
