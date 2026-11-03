import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, GetPostsQueryDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoupleTenantGuard } from '../common/guards/couple-tenant.guard';

@Controller('api/v1/posts')
@UseGuards(JwtAuthGuard, CoupleTenantGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  createPost(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.id, req.coupleId, dto);
  }

  @Get()
  getPosts(@Req() req: any, @Query() query: GetPostsQueryDto) {
    return this.postsService.getPosts(req.coupleId, query);
  }
}
