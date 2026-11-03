import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { AiService } from './ai.service';

export class GenerateReminderDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  daysUntilEvent?: number;

  @IsOptional()
  @IsString()
  partnerName?: string;

  @IsOptional()
  @IsString()
  tone?: string;
}

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Hỗ trợ cả 2 trường hợp:
  // 1. Khi main.ts KHÔNG dùng setGlobalPrefix('api/v1') -> khớp '/api/v1/ai/generate-reminder'
  // 2. Khi main.ts CÓ dùng setGlobalPrefix('api/v1') -> khớp '/ai/generate-reminder'
  @Post(['api/v1/ai/generate-reminder', 'ai/generate-reminder'])
  @HttpCode(HttpStatus.OK)
  async generateReminder(@Body() dto: GenerateReminderDto) {
    return this.aiService.generateReminder(dto);
  }
}
