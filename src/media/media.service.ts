// src/media/media.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmMediaUploadDto } from './dto/media.dto';

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'auto',
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      forcePathStyle: true, // <-- THÊM DÒNG NÀY VÀO ĐÂY
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName =
      this.configService.get<string>('S3_BUCKET_NAME') || 'lovevault-media';
  }

  async generatePresignedUrl(
    coupleId: string,
    filename: string,
    contentType: string,
  ) {
    const rawExt = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileKey = `couples/${coupleId}/${Date.now()}_${randomUUID()}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });
    const baseCdn =
      this.configService.get<string>('CDN_URL') ||
      `https://${this.bucketName}.s3.amazonaws.com`;
    const publicUrl = `${baseCdn.replace(/\/$/, '')}/${fileKey}`;

    return {
      uploadUrl,
      fileKey,
      publicUrl,
      remoteUrl: publicUrl,
    };
  }

  async confirmMediaUpload(
    coupleId: string,
    uploaderId: string,
    dto: ConfirmMediaUploadDto,
  ) {
    if (!dto.fileKey.startsWith(`couples/${coupleId}/`)) {
      throw new ForbiddenException(
        'fileKey không thuộc phạm vi phòng của cặp đôi hiện tại.',
      );
    }

    if (dto.idempotencyKey) {
      const existingByIdem = await this.prisma.coupleMedia.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingByIdem) {
        return existingByIdem;
      }
    }

    const existingByKey = await this.prisma.coupleMedia.findUnique({
      where: { fileKey: dto.fileKey },
    });
    if (existingByKey) {
      return existingByKey;
    }

    const createdMedia = await this.prisma.$transaction(async (tx) => {
      const mediaRecord = await tx.coupleMedia.create({
        data: {
          coupleId,
          uploaderId,
          category: dto.category,
          mediaType: dto.mediaType,
          fileKey: dto.fileKey,
          remoteUrl: dto.remoteUrl,
          thumbnailUrl: dto.thumbnailUrl || null,
          caption: dto.caption || null,
          stamp: dto.stamp || null,
          durationSec: dto.durationSec ?? null,
          idempotencyKey: dto.idempotencyKey || null,
        },
      });

      // Đồng bộ sang bảng posts để tương thích ngược với feed kỷ niệm cũ
      await tx.post.create({
        data: {
          coupleId,
          authorId: uploaderId,
          content: dto.caption || dto.stamp || null,
          mediaUrls: [dto.remoteUrl],
          postType:
            dto.category === 'LOCKET_SNAP'
              ? 'DAILY_MOMENT'
              : dto.mediaType === 'VIDEO'
                ? 'VIDEO_NOTE'
                : 'MEMORY',
        },
      });

      return mediaRecord;
    });

    return createdMedia;
  }

  async getCoupleWorkspaceMedia(coupleId: string, limit = 120) {
    const safeLimit = Math.min(Math.max(1, limit), 300);

    const items = await this.prisma.coupleMedia.findMany({
      where: { coupleId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: safeLimit,
    });

    const albumMedia = items.filter((item) => item.category === 'ALBUM_MEDIA');
    const locketSnaps = items.filter((item) => item.category === 'LOCKET_SNAP');
    const timeCapsules = items.filter(
      (item) => item.category === 'TIME_CAPSULE',
    );

    return {
      albumMedia,
      locketSnaps,
      timeCapsules,
      syncedAt: new Date().toISOString(),
    };
  }

  async reactToMedia(
    coupleId: string,
    userId: string,
    mediaId: string,
    emoji: string,
  ) {
    const target = await this.prisma.coupleMedia.findFirst({
      where: { id: mediaId, coupleId },
    });
    if (!target) {
      throw new NotFoundException('Không tìm thấy khoảnh khắc này trên Cloud.');
    }

    const currentReactions = Array.isArray(target.reactions)
      ? (target.reactions as Array<Record<string, any>>)
      : [];

    const nextReactions = [
      ...currentReactions.filter((r) => r.userId !== userId || r.emoji !== emoji),
      {
        id: `${userId}_${Date.now()}`,
        userId,
        emoji,
        createdAt: new Date().toISOString(),
      },
    ];

    return this.prisma.coupleMedia.update({
      where: { id: mediaId },
      data: { reactions: nextReactions },
    });
  }

  async deleteMedia(coupleId: string, mediaId: string) {
    const target = await this.prisma.coupleMedia.findFirst({
      where: { id: mediaId, coupleId },
    });

    if (!target) {
      throw new BadRequestException('Tệp không tồn tại hoặc đã bị xóa.');
    }

    await this.s3Client
      .send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: target.fileKey,
        }),
      )
      .catch(() => null);

    await this.prisma.coupleMedia.delete({
      where: { id: target.id },
    });

    return { deleted: true, id: target.id };
  }
}