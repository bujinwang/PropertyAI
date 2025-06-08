import { Request, Response } from 'express';
import VendorPerformanceService from '../services/vendorPerformanceService';

class VendorPerformanceController {
  async createRating(req: Request, res: Response) {
    try {
      const rating = await VendorPerformanceService.createRating(req.body);
      res.status(201).json(rating);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRating(req: Request, res: Response) {
    try {
      const rating = await VendorPerformanceService.getRating(req.params.id);
      if (rating) {
        res.status(200).json(rating);
      } else {
        res.status(404).json({ message: 'Rating not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRatingsForVendor(req: Request, res: Response) {
    try {
      const ratings = await VendorPerformanceService.getRatingsForVendor(
        req.params.vendorId
      );
      res.status(200).json(ratings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRatingsForWorkOrder(req: Request, res: Response) {
    try {
      const ratings = await VendorPerformanceService.getRatingsForWorkOrder(
        req.params.workOrderId
      );
      res.status(200).json(ratings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAverageScoreForVendor(req: Request, res: Response) {
    try {
      const averageScore =
        await VendorPerformanceService.getAverageScoreForVendor(
          req.params.vendorId
        );
      res.status(200).json({ averageScore });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new VendorPerformanceController();
