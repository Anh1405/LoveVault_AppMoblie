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

// Các trường người dùng được ghi vào hồ sơ của CHÍNH MÌNH
const PROFILE_FIELDS = [
  'nickname',
  'avatarUri',
  'birthDate',
  'moodEmoji',
  'customStatusText',
  'lastActiveAt',
] as const;

// Các trường được phép sửa trên hồ sơ của NGƯỜI KIA trong cùng cặp
// (mood / trạng thái hoạt động là của riêng họ nên không cho sửa hộ)
const PARTNER_EDITABLE_FIELDS = ['nickname', 'avatarUri', 'birthDate'] as const;

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

    // 2. Hồ sơ cá nhân: chỉ nhận phần của NGƯỜI ĐANG GỌI và của NGƯỜI KIA trong cùng cặp.
    //    ID người kia lấy từ DB (không tin uid tùy ý do client gửi lên).
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

      // Nếu bản trên server mới hơn bản gửi lên thì giữ nguyên,
      // tránh máy còn dữ liệu cũ ghi đè thay đổi vừa lưu từ máy kia.
      const incTs = Date.parse(incoming.updatedAt ?? '') || 0;
      const curTs = Date.parse(existing.updatedAt ?? '') || 0;
      if (incTs && curTs && curTs > incTs) continue;

      // Hồ sơ NGƯỜI KIA: chỉ ghi khi bản gửi lên có dấu thời gian và MỚI HƠN hẳn bản trên server.
      // Nhờ vậy một máy chỉ "mang theo" bản sao cũ của người kia (không sửa gì) sẽ không đè lên dữ liệu thật.
      if (uid !== userId && incTs <= curTs) continue;

      const fields: readonly string[] =
        uid === userId ? PROFILE_FIELDS : PARTNER_EDITABLE_FIELDS;

      const merged: Record<string, any> = { ...existing };
      for (const field of fields) {
        if (incoming[field] === undefined) continue;
        // Ảnh Base64 / đường dẫn file nội bộ không dùng được trên máy khác
        if (
          field === 'avatarUri' &&
          incoming[field] !== null &&
          !isHttpUrl(incoming[field])
        ) {
          continue;
        }
        merged[field] = incoming[field];
      }
      if (incoming.updatedAt) merged.updatedAt = incoming.updatedAt;
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
