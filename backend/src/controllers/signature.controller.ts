import { Request, Response } from 'express';
import { signatureService } from '../services/signature.service';
import logger from '../utils/logger';

export const signDocument = async (req: Request, res: Response) => {
  const { documentId, userId, signature } = req.body;

  if (!documentId || !userId || !signature) {
    return res.status(400).json({ error: 'Document ID, user ID, and signature are required' });
  }

  try {
    const result = await signatureService.signDocument(documentId, userId, signature);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error signing document: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
