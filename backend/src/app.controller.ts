import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  checkHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'vegah-backend',
    };
  }
}