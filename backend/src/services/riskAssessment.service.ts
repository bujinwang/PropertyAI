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
}

export const riskAssessmentService = new RiskAssessmentService();
