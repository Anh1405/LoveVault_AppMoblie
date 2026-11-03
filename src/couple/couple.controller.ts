// src/modules/couples/couple.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CoupleService } from './couple.service';
import { ConnectCodeDto } from './dto/couple.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoupleTenantGuard } from '../common/guards/couple-tenant.guard';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class CoupleController {
  constructor(
    private readonly coupleService: CoupleService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('pairing/generate-code')
  generateCode(@Req() req: any) {
    return this.coupleService.generatePairingCode(req.user.id);
  }

  @Post('pairing/connect')
  connect(@Req() req: any, @Body() dto: ConnectCodeDto) {
    return this.coupleService.connectCouple(req.user.id, dto.pairingCode);
  }

  @Get('couples/day-counter')
  @UseGuards(CoupleTenantGuard)
  getDayCounter(@Req() req: any, @Headers('x-timezone') clientTimezone?: string) {
    return this.coupleService.getDayCounter(req.coupleId, clientTimezone);
  }

  @Get('couples/workspace-sync')
  async getRoomWorkspace(@Req() req: any) {
    const coupleId = req.coupleId || req.user?.coupleId || req.query?.coupleId;
    if (!coupleId) return null;

    const [couple, state] = await Promise.all([
      this.prisma.couple.findUnique({ where: { id: coupleId } }),
      this.prisma.coupleWorkspaceState.findUnique({ where: { coupleId } }),
    ]);

    return {
      coupleId,
      anniversaryDate: couple?.anniversaryDate ?? null,
      sharedSettings: couple?.sharedSettings ?? null,
      events: (state?.events as any[]) ?? [],
      goals: (state?.goals as any[]) ?? [],
      dailyQA: state?.dailyQA ?? null,
      qaHistory: (state?.qaHistory as any[]) ?? [],
      updatedAt: state?.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  @Put('couples/workspace-sync')
  async upsertRoomWorkspace(@Req() req: any, @Body() body: any) {
    const coupleId = req.coupleId || req.user?.coupleId || body.coupleId;
    if (!coupleId) return { synced: false };

    const saved = await this.prisma.coupleWorkspaceState.upsert({
      where: { coupleId },
      create: {
        coupleId,
        events: body.events ?? [],
        goals: body.goals ?? [],
        dailyQA: body.dailyQA ?? null,
        qaHistory: body.qaHistory ?? [],
      },
      update: {
        ...(Array.isArray(body.events) ? { events: body.events } : {}),
        ...(Array.isArray(body.goals) ? { goals: body.goals } : {}),
        ...(body.dailyQA !== undefined ? { dailyQA: body.dailyQA } : {}),
        ...(Array.isArray(body.qaHistory) ? { qaHistory: body.qaHistory } : {}),
      },
    });

    return { synced: true, updatedAt: saved.updatedAt };
  }
}