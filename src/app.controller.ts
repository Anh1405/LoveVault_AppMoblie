import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealthCheck() {
    return {
      status: 'ok',
      message: '🚀 LoveVault Backend API đang hoạt động bình thường!',
      timestamp: new Date().toISOString(),
    };
  }
}