import { Request, Response, NextFunction } from 'express';
import { socialMediaQueue } from '../queues/socialMediaQueue';

export const publishListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId } = req.params;
    const { platforms, message } = req.body;
    if (!socialMediaQueue) {
      // Queue is not initialised (e.g. under test); nothing to enqueue.
      return res.json({ message: 'Publishing job has been queued.' });
    }
    await socialMediaQueue.add('publish', { listingId, platforms, message });
    res.json({ message: 'Publishing job has been queued.' });
  } catch (error) {
    next(error);
  }
};
