import { Request, Response } from 'express';
import { riskAssessmentService } from '../services/riskAssessment.service';

class RiskAssessmentController {
  public async assessRisk(req: Request, res: Response): Promise<void> {
    try {
      const { applicationId } = req.params;
      const riskAssessment = await riskAssessmentService.assessRisk(applicationId);
      if (riskAssessment) {
        res.status(201).json(riskAssessment);
      } else {
        res.status(404).json({ message: 'Could not assess risk.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error assessing risk.', error });
    }
  }
}

export const riskAssessmentController = new RiskAssessmentController();
