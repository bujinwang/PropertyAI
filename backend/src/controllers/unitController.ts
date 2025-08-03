/**
 * @deprecated This controller has been deprecated in favor of rentalController.
 * All Unit functionality has been consolidated into the Rental model.
 * 
 * Migration Guide:
 * - Use /api/rentals instead of /api/units
 * - Unit data is now stored in the Rental model with type: 'UNIT'
 * 
 * This file will be removed in a future version.
 */

import { Request, Response } from 'express';

const DEPRECATION_MESSAGE = {
  status: 'error',
  message: 'This endpoint has been deprecated. Please use /api/rentals instead.',
  migration: {
    'GET /api/units': 'GET /api/rentals?type=UNIT',
    'GET /api/units/:id': 'GET /api/rentals/:id',
    'POST /api/units': 'POST /api/rentals (with type: "UNIT")',
    'PUT /api/units/:id': 'PUT /api/rentals/:id',
    'DELETE /api/units/:id': 'DELETE /api/rentals/:id'
  },
  documentation: '/api/rentals/docs'
};

export class UnitController {
  async createUnit(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }
  
  async getUnitById(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }
  
  async getUnits(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }
  
  async getUnitsByProperty(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async updateUnit(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async assignTenant(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async removeTenant(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async deleteUnit(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async getPropertyOccupancy(req: Request, res: Response): Promise<Response> {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }
}

export default new UnitController();