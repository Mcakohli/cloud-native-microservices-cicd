import { Worker, Job } from 'bullmq';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

console.log(`[Worker] Connecting to Redis at ${redisConnection.host}:${redisConnection.port}...`);

const worker = new Worker(
  'taskQueue',
  async (job: Job) => {
    console.log(`[Worker] Processing Job ID: ${job.id} - Task: "${job.data.taskName}"`);

    // Simulate heavy asynchronous background execution (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const result = {
      summary: `Successfully processed task: ${job.data.taskName}`,
      processedAt: new Date().toISOString(),
      workerId: process.pid,
    };

    console.log(`[Worker] Completed Job ID: ${job.id}`);
    return result;
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
});

console.log('[Worker] Worker service ready and listening for jobs.');