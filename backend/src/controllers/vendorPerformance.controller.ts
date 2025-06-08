import { Request, Response } from 'express';
import { vendorPerformanceService } from '../services/vendorPerformance.service';

class VendorPerformanceController {
  public async recordVendorPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { vendorId, workOrderId, metricId, score, comments, ratedById } = req.body;
      const performanceRating = await vendorPerformanceService.recordVendorPerformance(
        vendorId,
        workOrderId,
        metricId,
        score,
        comments,
        ratedById
      );
      res.status(201).json(performanceRating);
    } catch (error) {
      res.status(500).json({ message: 'Error recording vendor performance.', error });
    }
  }
}

export const vendorPerformanceController = new VendorPerformanceController();
