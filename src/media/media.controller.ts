// src/media/media.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import {
  ConfirmMediaUploadDto,
  PresignedUrlDto,
  ReactMediaDto,
} from './dto/media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoupleTenantGuard } from '../common/guards/couple-tenant.guard';

@Controller('api/v1/media')
@UseGuards(JwtAuthGuard, CoupleTenantGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('presigned-url')
  getPresignedUrl(@Req() req: any, @Body() dto: PresignedUrlDto) {
    const coupleId = req.coupleId || req.user?.coupleId;
    return this.mediaService.generatePresignedUrl(
      coupleId,
      dto.filename,
      dto.contentType,
    );
  }

  @Post('confirm')
  confirmUpload(@Req() req: any, @Body() dto: ConfirmMediaUploadDto) {
    const coupleId = req.coupleId || req.user?.coupleId;
    const uploaderId = req.user?.id || req.user?.sub;
    return this.mediaService.confirmMediaUpload(coupleId, uploaderId, dto);
  }

  @Get('workspace')
  getWorkspaceMedia(@Req() req: any, @Query('limit') limit?: string) {
    const coupleId = req.coupleId || req.user?.coupleId;
    const parsedLimit = limit ? parseInt(limit, 10) : 120;
    return this.mediaService.getCoupleWorkspaceMedia(coupleId, parsedLimit);
  }

  @Post(':id/reactions')
  reactToMedia(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReactMediaDto,
  ) {
    const coupleId = req.coupleId || req.user?.coupleId;
    const userId = req.user?.id || req.user?.sub;
    return this.mediaService.reactToMedia(coupleId, userId, id, dto.emoji);
  }

  @Delete(':id')
  deleteMedia(@Req() req: any, @Param('id') id: string) {
    const coupleId = req.coupleId || req.user?.coupleId;
    return this.mediaService.deleteMedia(coupleId, id);
  }
}