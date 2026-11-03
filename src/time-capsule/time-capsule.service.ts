import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeCapsuleDto } from './dto/time-capsule.dto';

@Injectable()
export class TimeCapsuleService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('time-capsule-queue') private capsuleQueue: Queue,
  ) {}

  async createTimeCapsule(userId: string, coupleId: string, dto: CreateTimeCapsuleDto) {
    const unlockDate = new Date(dto.unlockAt);
    const now = new Date();

    if (unlockDate <= now) {
      throw new BadRequestException('Thời gian mở thư phải lớn hơn thời điểm hiện tại.');
    }

    const capsule = await this.prisma.timeCapsule.create({
      data: {
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        unlockAt: unlockDate,
        senderId: userId,
        coupleId,
      },
    });

    const delay = unlockDate.getTime() - now.getTime();
    await this.capsuleQueue.add(
      'unlock-capsule',
      { capsuleId: capsule.id, coupleId },
      { delay, jobId: `capsule-${capsule.id}` },
    );

    return capsule;
  }

  async getTimeCapsules(coupleId: string) {
    const capsules = await this.prisma.timeCapsule.findMany({
      where: { coupleId },
      orderBy: { unlockAt: 'asc' },
    });

    const now = new Date();

    return capsules.map((c) => {
      if (c.unlockAt > now) {
        return {
          id: c.id,
          unlockAt: c.unlockAt,
          isUnlocked: false,
          content: null,
          mediaUrl: null,
          createdAt: c.createdAt,
        };
      }

      return {
        ...c,
        isUnlocked: true,
      };
    });
  }
}
