import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs/jobs.controller';
import { AppController } from './app.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://vegah_user:vegah_pass@localhost:5432/vegah_db',
      autoLoadEntities: true,
      synchronize: true, // auto-sync schema for assessment simplicity
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'taskQueue',
    }),
  ],
  controllers: [AppController, JobsController],
})
export class AppModule {}