import express from 'express';
import * as publishingController from '../controllers/publishingController';

const router = express.Router();

router.post('/publish', publishingController.publishListing);

export default router;
