import { aiOrchestrationService } from './aiOrchestration.service';
import { dataIngestionService } from './dataIngestion.service';

class RiskAssessmentService {
  async getRiskAssessment(applicantId: string): Promise<any> {
    const applicantData = await dataIngestionService.getApplicantData(applicantId);
    const preprocessedData = await dataIngestionService.preprocessData(applicantData);

    const workflow = { name: 'risk-assessment' };
    const result = await aiOrchestrationService.submitWorkflow(workflow, preprocessedData);

    return result;
  }

  async assessRisk(applicationId: string): Promise<any> {
    // Mock implementation for now
    return {
      riskScore: Math.floor(Math.random() * 100),
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      factors: ['credit_score', 'income_verification', 'employment_history'],
      applicationId,
      timestamp: new Date().toISOString()
    };
  }
}

export const riskAssessmentService = new RiskAssessmentService();
