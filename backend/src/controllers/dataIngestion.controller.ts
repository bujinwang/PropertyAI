import { Request, Response } from 'express';
import { dataIngestionService } from '../services/dataIngestion.service';
import logger from '../utils/logger';

class DataIngestionController {
  async ingestData(req: Request, res: Response) {
    const { source, data } = req.body;

    if (!source || !data) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      switch (source) {
        case 'plaid':
          await dataIngestionService.ingestFromPlaid(data);
          break;
        case 'stripe':
          await dataIngestionService.ingestFromStripe(data);
          break;
        case 'csv':
          await dataIngestionService.ingestFromCsv(data);
          break;
        default:
          return res.status(400).json({ error: 'Invalid data source.' });
      }
      res.status(200).json({ message: 'Data ingestion successful.' });
    } catch (error) {
      logger.error(`Error ingesting data: ${error}`);
      res.status(500).json({ error: 'Failed to ingest data.' });
    }
  }
}

export const dataIngestionController = new DataIngestionController();
