/**
 * @deprecated This controller has been deprecated in favor of rentalController.
 * All Property functionality has been consolidated into the Rental model.
 * 
 * Migration Guide:
 * - Use /api/rentals instead of /api/properties
 * - Property data is now stored in the Rental model with type: 'PROPERTY'
 * 
 * This file will be removed in a future version.
 */

import { Request, Response } from 'express';

const DEPRECATION_MESSAGE = {
  status: 'error',
  message: 'This endpoint has been deprecated. Please use /api/rentals instead.',
  migration: {
    'GET /api/properties': 'GET /api/rentals?type=PROPERTY',
    'GET /api/properties/:id': 'GET /api/rentals/:id',
    'POST /api/properties': 'POST /api/rentals (with type: "PROPERTY")',
    'PUT /api/properties/:id': 'PUT /api/rentals/:id',
    'DELETE /api/properties/:id': 'DELETE /api/rentals/:id'
  },
  documentation: '/api/rentals/docs'
};

class PropertyController {
  async getAllProperties(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async createProperty(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async getPropertyById(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async updateProperty(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async deleteProperty(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }

  async getPublicProperties(req: Request, res: Response) {
    return res.status(410).json(DEPRECATION_MESSAGE);
  }
}

export default new PropertyController();
