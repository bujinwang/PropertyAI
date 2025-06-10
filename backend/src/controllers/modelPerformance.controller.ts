import { Request, Response } from 'express';
import { prisma } from '../config/database';

class ModelPerformanceController {
  public async getAllPerformance(req: Request, res: Response): Promise<void> {
    try {
      const performanceRecords = await prisma.modelPerformance.findMany({
        orderBy: {
          recordedAt: 'desc',
        },
      });
      res.status(200).json(performanceRecords);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const modelPerformanceController = new ModelPerformanceController();
