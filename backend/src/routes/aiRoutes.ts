import express from 'express';
import { getInsights } from '../controllers/aiController';

const router = express.Router();

router.get('/insights', getInsights);

export default router;