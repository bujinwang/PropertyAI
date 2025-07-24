import express from 'express';
import { getPublicListings } from '../controllers/listingController';

const router = express.Router();

router.get('/public', getPublicListings);

export default router;
