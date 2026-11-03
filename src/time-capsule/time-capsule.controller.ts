import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TimeCapsuleService } from './time-capsule.service';
import { CreateTimeCapsuleDto } from './dto/time-capsule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoupleTenantGuard } from '../common/guards/couple-tenant.guard';

@Controller('api/v1/time-capsules')
@UseGuards(JwtAuthGuard, CoupleTenantGuard)
export class TimeCapsuleController {
  constructor(private capsuleService: TimeCapsuleService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTimeCapsuleDto) {
    return this.capsuleService.createTimeCapsule(req.user.id, req.coupleId, dto);
  }

  @Get()
  getAll(@Req() req: any) {
    return this.capsuleService.getTimeCapsules(req.coupleId);
  }
}