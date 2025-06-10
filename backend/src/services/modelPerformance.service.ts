import { prisma } from '../config/database';
import { ModelPerformance } from '@prisma/client';

class ModelPerformanceService {
  public async recordPerformance(data: {
    modelName: string;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    version?: string;
    datasetInfo?: string;
    parameters?: any;
    notes?: string;
  }): Promise<ModelPerformance> {
    return prisma.modelPerformance.create({
      data,
    });
  }
}

export const modelPerformanceService = new ModelPerformanceService();
