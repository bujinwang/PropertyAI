import { Request, Response } from 'express';
import { documentService } from '../services/document.service';
import logger from '../utils/logger';

export const getDocumentUrl = async (req: Request, res: Response) => {
  const { documentId } = req.params;

  if (!documentId) {
    return res.status(400).json({ error: 'Document ID is required' });
  }

  try {
    const url = await documentService.getSignedUrlForDocument(documentId);
    if (url) {
      res.status(200).json({ url });
    } else {
      res.status(404).json({ error: 'Document not found' });
    }
  } catch (error) {
    logger.error(`Error getting document URL: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
