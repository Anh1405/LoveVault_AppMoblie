// src/modules/couples/couple.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CoupleService } from './couple.service';
import { ConnectCodeDto } from './dto/couple.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoupleTenantGuard } from '../common/guards/couple-tenant.guard';
import { PrismaService } from '@/prisma/prisma.service';

// Mỗi người chỉ được ghi các trường này vào hồ sơ của chính mình
const PROFILE_FIELDS = [
  'nickname',
  'avatarUri',
  'birthDate',
  'moodEmoji',
  'customStatusText',
  'lastActiveAt',
] as const;

// Các thiết lập dùng chung cho cả phòng
const ROOM_FIELDS = [
  'themePreset',
  'colorMode',
  'counterStyle',
  'countFromOne',
  'enableHeroParticles',
  'heroWallpaperUri',
  'socialPrefs',
  'loveCoupons',
  'streakDays',
  'heartTapTotal',
  'lastMissYouSentAt',
  'momoFund',
] as const;

const isHttpUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\//i.test(value);

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
  getDayCounter(
    @Req() req: any,
    @Headers('x-timezone') clientTimezone?: string,
  ) {
    return this.coupleService.getDayCounter(req.coupleId, clientTimezone);
  }

  @Patch('couples/anniversary')
  @UseGuards(CoupleTenantGuard)
  updateAnniversary(
    @Req() req: any,
    @Body() body: { anniversaryDate?: string; timezone?: string },
  ) {
    return this.coupleService.updateAnniversary(
      req.coupleId,
      body?.anniversaryDate as string,
      body?.timezone,
    );
  }

  // Trả về object phẳng, app đọc bằng res.data?.settings || res.data
  @Get('couples/shared-settings')
  @UseGuards(CoupleTenantGuard)
  async getSharedSettings(@Req() req: any) {
    const couple = await this.prisma.couple.findUnique({
      where: { id: req.coupleId },
      select: { sharedSettings: true },
    });
    return (couple?.sharedSettings as Record<string, any> | null) ?? {};
  }

  @Patch('couples/shared-settings')
  @UseGuards(CoupleTenantGuard)
  async patchSharedSettings(@Req() req: any, @Body() body: any) {
    const coupleId: string = req.coupleId;
    const userId = String(req.user.id);

    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      select: { sharedSettings: true },
    });
    const current =
      (couple?.sharedSettings as Record<string, any> | null) ?? {};
    const next: Record<string, any> = { ...current };

    // 1. Thiết lập chung của phòng
    for (const key of ROOM_FIELDS) {
      if (body?.[key] === undefined) continue;
      // Đường dẫn file nội bộ của máy khác không dùng được, giữ giá trị cũ trên server
      if (
        key === 'heroWallpaperUri' &&
        body[key] !== null &&
        !isHttpUrl(body[key])
      ) {
        continue;
      }
      next[key] = body[key];
    }

    // 2. Hồ sơ cá nhân: chỉ nhận phần của người đang gọi, bỏ qua mọi entry khác
    const incomingMine = body?.membersById?.[userId];
    if (incomingMine && typeof incomingMine === 'object') {
      const mine: Record<string, any> = {
        ...(current.membersById?.[userId] ?? {}),
      };
      for (const field of PROFILE_FIELDS) {
        if (incomingMine[field] === undefined) continue;
        if (
          field === 'avatarUri' &&
          incomingMine[field] !== null &&
          !isHttpUrl(incomingMine[field])
        ) {
          continue;
        }
        mine[field] = incomingMine[field];
      }
      mine.userId = userId;
      next.membersById = { ...(current.membersById ?? {}), [userId]: mine };
    }

    next.updatedAt = new Date().toISOString();

    await this.prisma.couple.update({
      where: { id: coupleId },
      data: { sharedSettings: next as Prisma.InputJsonValue },
    });

    return { synced: true, updatedAt: next.updatedAt };
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
