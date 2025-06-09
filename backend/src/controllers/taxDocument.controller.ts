import { Request, Response } from 'express';
import { taxDocumentService } from '../services/taxDocument.service';
import logger from '../utils/logger';

export const generateTaxDocument = async (req: Request, res: Response) => {
  const { propertyId, year } = req.params;

  if (!propertyId || !year) {
    return res.status(400).json({ error: 'Property ID and year are required' });
  }

  try {
    const filePath = await taxDocumentService.generateTaxDocument(propertyId, parseInt(year));
    if (filePath) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: 'Property not found' });
    }
  } catch (error) {
    logger.error(`Error generating tax document: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
