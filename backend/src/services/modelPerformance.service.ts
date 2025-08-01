import { prisma } from '../config/database';

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
  }): Promise<any> {
    // Since ModelPerformance doesn't exist in schema, create an audit entry instead
    return prisma.auditEntry.create({
      data: {
        action: 'RECORD_MODEL_PERFORMANCE',
        entityType: 'MODEL_PERFORMANCE',
        entityId: data.modelName,
        details: {
          modelName: data.modelName,
          accuracy: data.accuracy,
          precision: data.precision,
          recall: data.recall,
          f1Score: data.f1Score,
          version: data.version,
          datasetInfo: data.datasetInfo,
          parameters: data.parameters,
          notes: data.notes,
        },
      },
    });
  }
}

export const modelPerformanceService = new ModelPerformanceService();
