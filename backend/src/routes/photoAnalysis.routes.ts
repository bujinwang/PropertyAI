import { Router } from 'express';
import { analyzeMaintenancePhoto } from '../controllers/photoAnalysis.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /maintenance-requests/{maintenanceRequestId}/analyze-photo:
 *   post:
 *     summary: Analyzes a photo for a maintenance request.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis result.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
router.post(
  '/maintenance-requests/:maintenanceRequestId/analyze-photo',
  authMiddleware.protect,
  analyzeMaintenancePhoto
);

export default router;
