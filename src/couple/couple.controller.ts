// src/couple/couple.controller.ts
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
import { mergeSyncItems } from './workspace-merge';
import { Prisma } from '@prisma/client';
import { CoupleService } from './couple.service';
import { ConnectCodeDto } from './dto/couple.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoupleTenantGuard } from '../common/guards/couple-tenant.guard';
import { PrismaService } from '../prisma/prisma.service';

// avatarUri KHÔNG nằm trong 2 danh sách này: avatar được xử lý riêng theo avatarUpdatedAt
const PROFILE_FIELDS = [
  'nickname',
  'birthDate',
  'moodEmoji',
  'customStatusText',
  'lastActiveAt',
] as const;

const PARTNER_EDITABLE_FIELDS = ['nickname', 'birthDate'] as const;

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

const isValidMediaUrl = (value: unknown): value is string =>
  typeof value === 'string' &&
  (/^https?:\/\//i.test(value) || /^data:image\//i.test(value));

const parseTs = (value: unknown): number => {
  if (typeof value !== 'string') return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
};

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

  // ==================== HỎI ĐÁP CẶP ĐÔI (DAILY QA) ====================
  @Get('couples/daily-qa')
  @UseGuards(CoupleTenantGuard)
  getDailyQa(@Req() req: any) {
    return this.coupleService.getDailyQaWorkspace(req.coupleId, req.user.id);
  }

  @Post('couples/daily-qa/answer')
  @UseGuards(CoupleTenantGuard)
  submitDailyQaAnswer(@Req() req: any, @Body() body: any) {
    return this.coupleService.submitDailyQaAnswer(
      req.coupleId,
      req.user.id,
      body,
    );
  }

  @Post('couples/daily-qa/roll')
  @UseGuards(CoupleTenantGuard)
  rollDailyQaQuestion(@Req() req: any, @Body() body: any) {
    return this.coupleService.rollDailyQaQuestion(
      req.coupleId,
      req.user.id,
      body,
    );
  }

  // ==================== SHARED SETTINGS ====================
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
      if (
        key === 'heroWallpaperUri' &&
        body[key] !== null &&
        !isValidMediaUrl(body[key])
      ) {
        continue;
      }
      next[key] = body[key];
    }

    // 2. Hồ sơ cá nhân
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { partnerId: true },
    });
    const partnerId = me?.partnerId ? String(me.partnerId) : null;

    const incomingMembers: Record<string, any> =
      body?.membersById && typeof body.membersById === 'object'
        ? body.membersById
        : {};
    const nextMembers: Record<string, any> = { ...(current.membersById ?? {}) };

    for (const uid of [userId, partnerId]) {
      if (!uid) continue;
      const incoming = incomingMembers[uid];
      if (!incoming || typeof incoming !== 'object') continue;

      const existing: Record<string, any> = nextMembers[uid] ?? {};
      const merged: Record<string, any> = { ...existing };

      if (isValidMediaUrl(incoming.avatarUri)) {
        const incAvTs = parseTs(incoming.avatarUpdatedAt);
        const curAvTs = parseTs(existing.avatarUpdatedAt);
        const hasExistingAvatar = isValidMediaUrl(existing.avatarUri);
        if (!hasExistingAvatar || incAvTs > curAvTs) {
          merged.avatarUri = incoming.avatarUri;
          if (incoming.avatarUpdatedAt) {
            merged.avatarUpdatedAt = incoming.avatarUpdatedAt;
          }
        }
      }

      const incTs = parseTs(incoming.updatedAt);
      const curTs = parseTs(existing.updatedAt);
      const profileStale =
        uid !== userId && incTs > 0 && curTs > 0 && incTs < curTs;

      if (!profileStale) {
        const fields: readonly string[] =
          uid === userId ? PROFILE_FIELDS : PARTNER_EDITABLE_FIELDS;
        for (const field of fields) {
          if (incoming[field] === undefined) continue;
          merged[field] = incoming[field];
        }
        const latestTs = Math.max(incTs, curTs);
        if (latestTs > 0) {
          merged.updatedAt =
            incTs >= curTs ? incoming.updatedAt : existing.updatedAt;
        }
      }

      merged.userId = uid;
      nextMembers[uid] = merged;
    }
    next.membersById = nextMembers;
    next.updatedAt = new Date().toISOString();

    await this.prisma.couple.update({
      where: { id: coupleId },
      data: { sharedSettings: next as Prisma.InputJsonValue },
    });

    return { synced: true, updatedAt: next.updatedAt };
  }

  @Get('couples/workspace-sync')
  @UseGuards(CoupleTenantGuard)
  async getRoomWorkspace(@Req() req: any) {
    const coupleId: string = req.coupleId;

    const [couple, state] = await Promise.all([
      this.prisma.couple.findUnique({ where: { id: coupleId } }),
      this.prisma.coupleWorkspaceState.findUnique({ where: { coupleId } }),
    ]);

    return {
      coupleId,
      anniversaryDate: couple?.anniversaryDate ?? null,
      sharedSettings: couple?.sharedSettings ?? null,
      // Mảng này CÓ chứa tombstone ({ id, deletedAt }) để máy kia biết mục nào đã xóa
      events: (state?.events as any[]) ?? [],
      goals: (state?.goals as any[]) ?? [],
      dailyQA: state?.dailyQA ?? null,
      qaHistory: (state?.qaHistory as any[]) ?? [],
      updatedAt: state?.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  @Put('couples/workspace-sync')
  @UseGuards(CoupleTenantGuard)
  async upsertRoomWorkspace(@Req() req: any, @Body() body: any) {
    const coupleId: string = req.coupleId;

    const saved = await this.prisma.$transaction(async (tx) => {
      // Bảo đảm dòng tồn tại, rồi khóa dòng để hai máy đẩy cùng lúc không đè nhau
      await tx.coupleWorkspaceState.upsert({
        where: { coupleId },
        create: { coupleId },
        update: {},
      });
      const rows = await tx.$queryRaw<{ events: unknown; goals: unknown }[]>`
        SELECT events, goals
        FROM couple_workspace_states
        WHERE couple_id = ${coupleId}::uuid
        FOR UPDATE
      `;
      const current = rows[0] ?? { events: [], goals: [] };

      const nextEvents = Array.isArray(body?.events)
        ? mergeSyncItems(current.events, body.events)
        : undefined;
      const nextGoals = Array.isArray(body?.goals)
        ? mergeSyncItems(current.goals, body.goals)
        : undefined;

      return tx.coupleWorkspaceState.update({
        where: { coupleId },
        data: {
          ...(nextEvents
            ? { events: nextEvents as unknown as Prisma.InputJsonValue }
            : {}),
          ...(nextGoals ? { goals: nextGoals as unknown as Prisma.InputJsonValue } : {}),
          // Daily QA giữ nguyên cách ghi cũ
          ...(body?.dailyQA !== undefined ? { dailyQA: body.dailyQA } : {}),
          ...(Array.isArray(body?.qaHistory)
            ? { qaHistory: body.qaHistory }
            : {}),
        },
      });
    });

    return { synced: true, updatedAt: saved.updatedAt };
  }
}
