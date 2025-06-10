import { Router } from 'express';
import { dataIngestionController } from '../controllers/dataIngestion.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /data-ingestion:
 *   post:
 *     summary: Ingests data from various sources.
 *     tags: [Data Ingestion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Data ingestion successful.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post(
  '/',
  authMiddleware.protect,
  dataIngestionController.ingestData
);

export default router;
