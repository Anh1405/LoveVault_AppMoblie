import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, GetPostsQueryDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, coupleId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        content: dto.content,
        mediaUrls: dto.mediaUrls || [],
        authorId: userId,
        coupleId,
      },
      include: {
        author: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  async getPosts(coupleId: string, query: GetPostsQueryDto) {
    const { cursor, limit } = query;

    const posts = await this.prisma.post.findMany({
      where: { coupleId },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        author: {
          select: { id: true, fullName: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id || null;
    }

    return {
      data: posts,
      meta: {
        nextCursor,
        limit,
      },
    };
  }
}
