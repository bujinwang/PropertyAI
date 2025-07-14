import { spawn } from 'child_process';
import path from 'path';

class RiskAssessmentModelService {
  async getRiskAssessment(applicantData: any): Promise<any> {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../predictive-analytics/src/deployment/deploy_model.py'),
      JSON.stringify(applicantData),
    ]);

    return new Promise((resolve, reject) => {
      pythonProcess.stdout.on('data', (data) => {
        resolve(JSON.parse(data.toString()));
      });

      pythonProcess.stderr.on('data', (data) => {
        reject(data.toString());
      });
    });
  }
}

export const riskAssessmentModelService = new RiskAssessmentModelService();
