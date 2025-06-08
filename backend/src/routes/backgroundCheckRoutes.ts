import express from 'express';
import * as backgroundCheckController from '../controllers/backgroundCheckController';

const router = express.Router();

router.post('/', backgroundCheckController.performCheck);

export default router;
