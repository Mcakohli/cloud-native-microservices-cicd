import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('jobs')
export class JobsController {
  constructor(@InjectQueue('taskQueue') private taskQueue: Queue) {}

  @Post('submit')
  async submitTask(@Body('taskName') taskName: string) {
    const job = await this.taskQueue.add('processData', {
      taskName,
      submittedAt: new Date().toISOString(),
    });
    return { jobId: job.id, status: 'QUEUED' };
  }

  @Get(':id')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.taskQueue.getJob(id);
    if (!job) return { error: 'Job not found' };
    const state = await job.getState();
    return {
      id: job.id,
      state,
      returnvalue: job.returnvalue,
      progress: job.progress,
    };
  }
}