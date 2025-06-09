import { Request, Response } from 'express';
import { legalNoticeService } from '../services/legalNotice.service';
import logger from '../utils/logger';

export const sendLegalNotice = async (req: Request, res: Response) => {
  const { tenantId, message } = req.body;

  if (!tenantId || !message) {
    return res.status(400).json({ error: 'Tenant ID and message are required' });
  }

  try {
    await legalNoticeService.sendLegalNotice(tenantId, message);
    res.status(200).json({ message: 'Legal notice sent successfully' });
  } catch (error) {
    logger.error(`Error sending legal notice: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
