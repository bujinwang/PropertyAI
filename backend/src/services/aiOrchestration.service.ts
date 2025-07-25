import { generativeAIService } from './generativeAI.service';
import { riskAssessmentModelService } from './riskAssessmentModel.service';

class AiOrchestrationService {
  async generateText(prompt: string): Promise<string> {
    return generativeAIService.generateText(prompt);
  }

  async submitWorkflow(workflow: any, data: any): Promise<any> {
    console.log(`Simulating workflow submission for: ${workflow.name}`);
    console.log('Workflow data:', JSON.stringify(data, null, 2));

    // In a real implementation, this would interact with a message broker (e.g., RabbitMQ, Kafka)
    // or a dedicated workflow engine. For this simulation, we'll just log and return a success.

    // Simulate asynchronous processing
    await new Promise(resolve => setTimeout(resolve, 500));

    if (workflow.name === 'risk-assessment') {
      // If it's a risk assessment, still call the actual service
      return await riskAssessmentModelService.getRiskAssessment(data);
    }

    // Generic success response for other workflows
    return {
      status: 'success',
      message: `Workflow '${workflow.name}' submitted successfully.`,
      receivedData: data,
    };
  }
}

export const aiOrchestrationService = new AiOrchestrationService();
