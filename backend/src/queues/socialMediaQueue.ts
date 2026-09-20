import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as socialMediaService from '../services/socialMediaService';

// Under Jest the module graph is evaluated to build automocks, and many suites
// import ../app which transitively imports this file. Creating an IORedis
// connection and a bullmq Worker at import time opens sockets (and internal
// timers) that keep the event loop alive and, when Redis is unavailable, retry
// forever — so the test process never exits. Skip all connection setup under
// test; nothing in the suite exercises this queue. In normal runtime the block
// below still runs at import time, preserving the original behaviour.
const isTest =
  process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

let connection: IORedis | null = null;
let worker: Worker | null = null;

// Null until initialised; the controller guards against a null queue so that
// importing this module under test is side-effect free.
export let socialMediaQueue: Queue | null = null;

if (!isTest) {
  connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  socialMediaQueue = new Queue('social-media', { connection });

  worker = new Worker('social-media', async job => {
    const { listingId, platforms, message } = job.data;
    await socialMediaService.publishToSocialMedia(listingId, platforms, message);
  }, { connection });

  worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
  });
}
