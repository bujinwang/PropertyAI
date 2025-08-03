import { Request, Response } from 'express';
import { aiOrchestrationService } from '../services/aiOrchestrationService';

class DocumentController {
  async generateLease(req: Request, res: Response) {
    try {
      const {
        rentalId, // Changed from propertyId and unitId to rentalId
        tenantId,
        startDate,
        endDate,
        rentAmount,
        securityDeposit,
      } = req.body;

      const lease = await aiOrchestrationService.generateLeaseAgreement(
        rentalId, // Now using single rentalId instead of propertyId and unitId
        tenantId,
        new Date(startDate),
        new Date(endDate),
        rentAmount,
        securityDeposit
      );

      res.status(201).json(lease);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new DocumentController();
