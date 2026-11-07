import { Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const taskWorker = new Worker(
  'taskQueue',
  async (job) => {
    console.log(`Processing job ${job.id}:`, job.data);
    await new Promise((res) => setTimeout(res, 5000)); // Simulate async heavy job
    return {
      result: `Completed processing "${job.data.taskName}"`,
      processedAt: new Date().toISOString(),
    };
  },
  { connection }
);