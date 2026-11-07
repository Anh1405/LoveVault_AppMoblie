// src/couple/couple.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateTime } from 'luxon';

@Injectable()
export class CoupleService {
  constructor(private prisma: PrismaService) {}

  async generatePairingCode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');
    if (user.coupleId) throw new BadRequestException('Bạn đã ghép đôi rồi.');

    const now = new Date();

    // 1. Kiểm tra bản ghi PENDING hiện có của user
    const existingCouple = await this.prisma.couple.findFirst({
      where: {
        user1Id: userId,
        status: 'PENDING',
      },
    });

    // 2. Nếu mã cũ còn hiệu lực (chưa quá 15 phút), giữ nguyên mã cũ và trả về số giây còn lại
    if (
      existingCouple &&
      existingCouple.pairingCode &&
      existingCouple.pairingCodeExpiresAt &&
      existingCouple.pairingCodeExpiresAt > now
    ) {
      const ttlSeconds = Math.max(
        0,
        Math.floor(
          (existingCouple.pairingCodeExpiresAt.getTime() - now.getTime()) /
            1000,
        ),
      );

      return {
        pairingCode: existingCouple.pairingCode,
        expiresAt: existingCouple.pairingCodeExpiresAt,
        ttlSeconds,
      };
    }

    // 3. Nếu chưa có mã hoặc mã cũ đã hết hạn, sinh mã 6 chữ số mới cho 15 phút tiếp theo
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (existingCouple) {
      await this.prisma.couple.update({
        where: { id: existingCouple.id },
        data: { pairingCode, pairingCodeExpiresAt: expiresAt },
      });
    } else {
      await this.prisma.couple.create({
        data: {
          user1Id: userId,
          pairingCode,
          pairingCodeExpiresAt: expiresAt,
          anniversaryDate: new Date(),
          status: 'PENDING',
        },
      });
    }

    const ttlSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    return { pairingCode, expiresAt, ttlSeconds };
  }

  async connectCouple(userId: string, pairingCode: string) {
    return this.prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      if (!currentUser) throw new NotFoundException('Tài khoản không tồn tại.');
      if (currentUser.coupleId)
        throw new BadRequestException('Bạn đã thuộc một cặp đôi khác.');

      const pendingCouple = await tx.couple.findFirst({
        where: {
          pairingCode,
          pairingCodeExpiresAt: { gt: new Date() },
          status: 'PENDING',
        },
      });

      if (!pendingCouple) {
        throw new NotFoundException(
          'Mã ghép đôi không hợp lệ hoặc đã hết hạn.',
        );
      }

      if (pendingCouple.user1Id === userId) {
        throw new BadRequestException('Không thể tự kết nối với chính mình.');
      }

      const couple = await tx.couple.update({
        where: { id: pendingCouple.id },
        data: {
          user2Id: userId,
          status: 'ACTIVE',
          pairingCode: null,
          pairingCodeExpiresAt: null,
        },
      });

      await tx.user.update({
        where: { id: pendingCouple.user1Id },
        data: { coupleId: couple.id, partnerId: userId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { coupleId: couple.id, partnerId: pendingCouple.user1Id },
      });

      const partner = await tx.user.findUnique({
        where: { id: pendingCouple.user1Id },
        select: { id: true, fullName: true, email: true },
      });

      return {
        message: 'Ghép đôi thành công!',
        coupleId: couple.id,
        partner,
      };
    });
  }

  async getDayCounter(coupleId: string, timezone: string = 'Asia/Ho_Chi_Minh') {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
    });

    if (!couple)
      throw new NotFoundException('Không tìm thấy thông tin cặp đôi.');

    const userTz = DateTime.now().setZone(timezone).isValid
      ? timezone
      : 'Asia/Ho_Chi_Minh';

    const startDateInTz = DateTime.fromJSDate(couple.anniversaryDate)
      .setZone(userTz)
      .startOf('day');
    const todayInTz = DateTime.now().setZone(userTz).startOf('day');

    const daysTogether =
      Math.floor(todayInTz.diff(startDateInTz, 'days').days) + 1;

    return {
      coupleId: couple.id,
      daysTogether: Math.max(1, daysTogether),
      startDate: startDateInTz.toISODate(),
      timezone: userTz,
    };
  }
  async getDailyQaWorkspace(coupleId: string, viewerUserId: string) {
  const couple = await this.prisma.couple.findUnique({
    where: { id: coupleId },
    select: { activeQuestionId: true },
  });

  const allRecords = await this.prisma.coupleDailyQA.findMany({
    where: { coupleId },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const formatRecord = (r: any) => {
    const map = (r.answers as Record<string, any>) || {};
    const bothAnswered = Object.keys(map).length >= 2;
    const myEntry = map[viewerUserId];
    const partnerEntry = Object.values(map).find((e: any) => e.userId !== viewerUserId);

    const safeMap: Record<string, any> = {};
    for (const [uid, val] of Object.entries(map)) {
      safeMap[uid] =
        uid === viewerUserId || bothAnswered
          ? val
          : { ...val, answer: '', isLocked: true };
    }

    return {
      questionId: r.questionId,
      category: r.category,
      questionText: r.questionText,
      myAnswer: myEntry?.answer || '',
      partnerAnswer: bothAnswered ? partnerEntry?.answer || null : null,
      hasPartnerAnswered: Boolean(partnerEntry),
      bothAnswered,
      answeredAt: myEntry?.answeredAt || null,
      answersByUserId: safeMap,
    };
  };

  const activeId = couple?.activeQuestionId;
  const activeRecord =
    allRecords.find((r) => r.questionId === activeId) || allRecords[0] || null;

  const history = allRecords
    .filter((r) => Object.keys((r.answers as object) || {}).length > 0)
    .map(formatRecord);

  return {
    activeQA: activeRecord ? formatRecord(activeRecord) : null,
    history,
  };
}
  async updateAnniversary(
    coupleId: string,
    anniversaryDate: string,
    timezone?: string,
  ) {
    if (
      typeof anniversaryDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(anniversaryDate)
    ) {
      throw new BadRequestException('Ngày kỷ niệm phải có dạng YYYY-MM-DD.');
    }

    // Cột anniversaryDate là kiểu DATE thuần, lưu 00:00 UTC của đúng ngày đó
    const parsed = DateTime.fromISO(anniversaryDate, { zone: 'utc' });
    if (!parsed.isValid) {
      throw new BadRequestException('Ngày kỷ niệm không hợp lệ.');
    }

    const validTimezone =
      timezone && DateTime.now().setZone(timezone).isValid
        ? timezone
        : undefined;

    const couple = await this.prisma.couple.update({
      where: { id: coupleId },
      data: {
        anniversaryDate: parsed.toJSDate(),
        ...(validTimezone ? { canonicalTimezone: validTimezone } : {}),
      },
    });

    return {
      coupleId: couple.id,
      anniversaryDate,
      timezone: couple.canonicalTimezone,
    };
  }
}
