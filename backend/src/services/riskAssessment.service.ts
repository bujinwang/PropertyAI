import { prisma } from '../config/database';
import { Application, RiskAssessment } from '@prisma/client';

class RiskAssessmentService {
  public async assessRisk(applicationId: string): Promise<RiskAssessment | null> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        screening: true,
      },
    });

    if (application && application.screening) {
      // This is a placeholder for the actual risk assessment logic.
      // In a real application, this would involve using a machine learning model
      // to assess the risk based on the applicant's screening data.
      const score = Math.random();
      const summary =
        score > 0.5
          ? 'Low risk'
          : 'High risk';

      const riskAssessment = await prisma.riskAssessment.create({
        data: {
          applicationId,
          score,
          summary,
        },
      });

      return riskAssessment;
    }

    return null;
  }
}

export const riskAssessmentService = new RiskAssessmentService();
