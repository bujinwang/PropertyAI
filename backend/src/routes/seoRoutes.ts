import express from 'express';
import * as seoController from '../controllers/seoController';

const router = express.Router();

router.get('/:listingId', seoController.getSeoData);

export default router;
