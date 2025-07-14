import express from 'express';
import * as documentVerificationController from '../controllers/documentVerificationController';

const router = express.Router();

router.post('/verify', documentVerificationController.verify);

export default router;
