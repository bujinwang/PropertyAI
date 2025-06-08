import express from 'express';
import * as socialMediaController from '../controllers/socialMediaController';

const router = express.Router();

router.post('/publish/:listingId', socialMediaController.publishListing);

export default router;
