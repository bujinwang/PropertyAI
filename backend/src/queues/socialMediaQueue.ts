import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as socialMediaService from '../services/socialMediaService';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const socialMediaQueue = new Queue('social-media', { connection });

const worker = new Worker('social-media', async job => {
  const { listingId, platforms, message } = job.data;
  await socialMediaService.publishToSocialMedia(listingId, platforms, message);
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
