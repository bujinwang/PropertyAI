import { prisma } from '../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

class CashFlowForecastingService {
  public async forecastCashFlow(months: number): Promise<any | null> {
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
      },
      orderBy: {
        processedAt: 'asc',
      },
    });

    if (!transactions.length) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Based on the following transactions, forecast the cash flow for the next ${months} months:\n\n${JSON.stringify(transactions)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const forecast = response.text();

    return { forecast };
  }
}

export const cashFlowForecastingService = new CashFlowForecastingService();
