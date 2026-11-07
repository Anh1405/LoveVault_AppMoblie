// src/couple/qa.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface SubmitAnswerPayload {
  questionId: string;
  questionText: string;
  category: string;
  nickname: string;
  answer: string;
}

interface RollQuestionPayload {
  questionId: string;
  questionText: string;
  category: string;
}

@WebSocketGateway({
  namespace: '/qa',
  cors: { origin: '*', credentials: true },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class QaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!rawToken) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(rawToken);
      const userId = payload.sub || payload.id;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, coupleId: true },
      });

      if (!user || !user.coupleId) {
        client.disconnect(true);
        return;
      }

      client.data.userId = user.id;
      client.data.coupleId = user.coupleId;

      const roomName = `couple:${user.coupleId}`;
      await client.join(roomName);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const { coupleId, userId } = client.data || {};
    if (coupleId && userId) {
      this.server.to(`couple:${coupleId}`).emit('qa:partner_typing', {
        userId,
        isTyping: false,
      });
    }
  }

  /**
   * Ẩn nội dung câu trả lời của đối phương nếu chưa đủ 2 người trả lời
   */
  private sanitizeForUser(
    record: {
      questionId: string;
      category: string;
      questionText: string;
      answers: Record<string, any>;
    },
    viewerUserId: string,
  ) {
    const answersMap = record.answers || {};
    const participantIds = Object.keys(answersMap);
    const bothAnswered = participantIds.length >= 2;

    const sanitizedAnswers: Record<string, any> = {};
    for (const [uid, entry] of Object.entries(answersMap)) {
      if (uid === viewerUserId || bothAnswered) {
        sanitizedAnswers[uid] = entry;
      } else {
        sanitizedAnswers[uid] = {
          ...entry,
          answer: '', // Khóa nội dung thật trên đường truyền khi người kia chưa trả lời
          isLocked: true,
        };
      }
    }

    return {
      questionId: record.questionId,
      category: record.category,
      questionText: record.questionText,
      bothAnswered,
      answersByUserId: sanitizedAnswers,
    };
  }

  private async broadcastStateToRoom(coupleId: string, record: any) {
    const roomName = `couple:${coupleId}`;
    const sockets = await this.server.in(roomName).fetchSockets();
    for (const sock of sockets) {
      const viewerId = sock.data.userId;
      sock.emit('qa:state_updated', this.sanitizeForUser(record, viewerId));
    }
  }

  @SubscribeMessage('qa:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { isTyping: boolean; nickname: string },
  ) {
    const { coupleId, userId } = client.data || {};
    if (!coupleId || !userId) return;

    client.to(`couple:${coupleId}`).emit('qa:partner_typing', {
      userId,
      nickname: body.nickname,
      isTyping: Boolean(body.isTyping),
    });
  }

  @SubscribeMessage('qa:submit_answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SubmitAnswerPayload,
  ) {
    const { coupleId, userId } = client.data || {};
    if (!coupleId || !userId || !dto?.questionId || !dto?.answer?.trim()) {
      return { status: 'ERROR', message: 'Dữ liệu không hợp lệ' };
    }

    const cleanAnswer = dto.answer.trim().slice(0, 1000);
    const nowIso = new Date().toISOString();

    // Sử dụng Serializable Transaction để chặn race condition khi 2 người gửi cùng 1 mili-giây
    const updatedRecord = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.coupleDailyQA.findUnique({
        where: {
          coupleId_questionId: {
            coupleId,
            questionId: dto.questionId,
          },
        },
      });

      const currentAnswers =
        existing && typeof existing.answers === 'object' && existing.answers !== null
          ? (existing.answers as Record<string, any>)
          : {};

      const nextAnswers = {
        ...currentAnswers,
        [userId]: {
          userId,
          nickname: dto.nickname || 'Người ấy',
          answer: cleanAnswer,
          answeredAt: nowIso,
        },
      };

      const saved = await tx.coupleDailyQA.upsert({
        where: {
          coupleId_questionId: {
            coupleId,
            questionId: dto.questionId,
          },
        },
        create: {
          coupleId,
          questionId: dto.questionId,
          category: dto.category,
          questionText: dto.questionText,
          answers: nextAnswers,
        },
        update: {
          answers: nextAnswers,
        },
      });

      await tx.couple.update({
        where: { id: coupleId },
        data: { activeQuestionId: dto.questionId },
      });

      return saved;
    });

    await this.broadcastStateToRoom(coupleId, updatedRecord);
    return {
      status: 'OK',
      data: this.sanitizeForUser(updatedRecord as any, userId),
    };
  }

  @SubscribeMessage('qa:roll_question')
  async handleRollQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: RollQuestionPayload,
  ) {
    const { coupleId } = client.data || {};
    if (!coupleId || !dto?.questionId) return;

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.couple.update({
        where: { id: coupleId },
        data: { activeQuestionId: dto.questionId },
      });

      return tx.coupleDailyQA.upsert({
        where: {
          coupleId_questionId: {
            coupleId,
            questionId: dto.questionId,
          },
        },
        create: {
          coupleId,
          questionId: dto.questionId,
          category: dto.category,
          questionText: dto.questionText,
          answers: {},
        },
        update: {},
      });
    });

    await this.broadcastStateToRoom(coupleId, record);
    return { status: 'OK' };
  }
}