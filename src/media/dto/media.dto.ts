// src/media/dto/media.dto.ts
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export enum MediaCategoryDto {
  ALBUM_MEDIA = 'ALBUM_MEDIA',
  LOCKET_SNAP = 'LOCKET_SNAP',
  TIME_CAPSULE = 'TIME_CAPSULE',
}

export enum MediaTypeDto {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class PresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/\.(jpg|jpeg|png|webp|gif|heic|mp4|mov|m4v|webm)$/i, {
    message:
      'Chỉ chấp nhận các định dạng ảnh (jpg, jpeg, png, webp, gif, heic) hoặc video (mp4, mov, m4v, webm).',
  })
  filename!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^(image\/(jpeg|jpg|png|webp|gif|heic)|video\/(mp4|quicktime|x-m4v|webm))$/i, {
    message: 'Content-Type không hợp lệ. Chỉ chấp nhận image/* hoặc video/* chuẩn.',
  })
  contentType!: string;
}

export class ConfirmMediaUploadDto {
  @IsEnum(MediaCategoryDto)
  category!: MediaCategoryDto;

  @IsEnum(MediaTypeDto)
  mediaType!: MediaTypeDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  fileKey!: string;

  @IsString()
  @IsNotEmpty()
  remoteUrl!: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  stamp?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  idempotencyKey?: string;
}

export class ReactMediaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  emoji!: string;
}