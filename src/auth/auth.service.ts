import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  // Bộ nhớ tạm lưu mã OTP khôi phục mật khẩu:
  // otp: Mã thô để gửi lại mail khi còn hạn 5 phút
  // otpHash: Mã băm Argon2 dùng đối chiếu bảo mật
  // expiresAt: Mốc hết hạn OTP (5 phút)
  // lastSentAt: Mốc thời gian gửi mail gần nhất (dùng kiểm tra cooldown 2 phút)
  private readonly otpCache = new Map<
    string,
    { otp: string; otpHash: string; expiresAt: number; lastSentAt: number }
  >();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private normalizeAndValidateEmail(
    rawEmail: string,
    isStrictRegister = false,
  ): string {
    if (!rawEmail || typeof rawEmail !== 'string') {
      throw new BadRequestException('Vui lòng nhập địa chỉ email.');
    }

    const stripped = rawEmail.replace(/[\s\u200B-\u200D\uFEFF]+/g, '').toLowerCase();

    const parts = stripped.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new BadRequestException('Định dạng địa chỉ email không hợp lệ.');
    }

    const [localPart, domainPart] = parts;
    const isGmail = domainPart === 'gmail.com' || domainPart === 'googlemail.com';

    if (isGmail) {
      const baseUsername = localPart.split('+')[0];
      const canonicalUsername = baseUsername.replace(/\./g, '');

      if (isStrictRegister) {
        if (
          localPart.startsWith('.') ||
          localPart.endsWith('.') ||
          localPart.includes('..')
        ) {
          throw new BadRequestException(
            'Địa chỉ Gmail không được bắt đầu, kết thúc hoặc chứa hai dấu chấm liên tiếp.',
          );
        }

        if (!/^[a-z0-9.+]+$/.test(localPart)) {
          throw new BadRequestException(
            'Tài khoản Gmail chỉ được chứa chữ cái (a-z), chữ số (0-9) và dấu chấm (.).',
          );
        }

        if (canonicalUsername.length < 6 || canonicalUsername.length > 30) {
          throw new BadRequestException(
            'Tên tài khoản Gmail phải có độ dài từ 6 đến 30 ký tự (không tính dấu chấm).',
          );
        }
      }

      if (!canonicalUsername) {
        throw new BadRequestException('Địa chỉ Gmail không hợp lệ.');
      }

      return `${canonicalUsername}@gmail.com`;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(stripped) || localPart.includes('..')) {
      throw new BadRequestException('Định dạng địa chỉ email không hợp lệ.');
    }

    return stripped;
  }

  private sanitizeFullName(rawName: string): string {
    if (!rawName || typeof rawName !== 'string') {
      throw new BadRequestException('Vui lòng nhập họ và tên.');
    }
    const cleanName = rawName.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2 || cleanName.length > 100) {
      throw new BadRequestException('Họ và tên phải từ 2 đến 100 ký tự.');
    }
    return cleanName;
  }

  private async generateTokens(userId: string, coupleId?: string | null) {
    const payload = {
      sub: userId,
      coupleId: coupleId || null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:
          process.env.JWT_ACCESS_SECRET ||
          'lovevault_super_secret_access_key_2026',
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as any) || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'lovevault_super_secret_refresh_key_2026',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '30d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async checkEmailAvailability(rawEmail: string) {
    const canonicalEmail = this.normalizeAndValidateEmail(rawEmail, true);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: canonicalEmail }, { canonicalEmail }],
      },
      select: { id: true },
    });

    return {
      exists: Boolean(existingUser),
      normalizedEmail: canonicalEmail,
    };
  }

  async register(dto: RegisterDto) {
    const canonicalEmail = this.normalizeAndValidateEmail(dto.email, true);
    const displayEmail = dto.email
      .replace(/[\s\u200B-\u200D\uFEFF]+/g, '')
      .toLowerCase();
    const fullName = this.sanitizeFullName(dto.fullName);

    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException(
        'Mật khẩu cần đạt độ dài từ 8 ký tự trở lên.',
      );
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: canonicalEmail },
          { email: displayEmail },
          { canonicalEmail },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    const passwordHash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: canonicalEmail,
          canonicalEmail,
          passwordHash,
          fullName,
          timezone: dto.timezone?.trim() || 'Asia/Ho_Chi_Minh',
        },
      });

      const tokens = await this.generateTokens(user.id, null);

      return {
        ...tokens,
        coupleId: null,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          coupleId: null,
          partnerId: null,
          timezone: user.timezone,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email này đã được sử dụng.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    let email: string;
    try {
      email = this.normalizeAndValidateEmail(dto.email, false);
    } catch {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    if (!dto.password) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const fallbackCleanEmail = dto.email
      .replace(/[\s\u200B-\u200D\uFEFF]+/g, '')
      .toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { email: fallbackCleanEmail },
          { canonicalEmail: email },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    let activeCoupleId = user.coupleId;
    let partnerId = user.partnerId;
    const updatePayload: Prisma.UserUpdateInput = {};

    if (user.email !== email) {
      const conflictCheck = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!conflictCheck) {
        updatePayload.email = email;
      }
    }

    if (user.canonicalEmail !== email) {
      const canonicalConflict = await this.prisma.user.findUnique({
        where: { canonicalEmail: email },
        select: { id: true },
      });
      if (!canonicalConflict) {
        updatePayload.canonicalEmail = email;
      }
    }

    if (!activeCoupleId) {
      const existingActiveCouple = await this.prisma.couple.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [{ user1Id: user.id }, { user2Id: user.id }],
        },
        select: { id: true, user1Id: true, user2Id: true },
      });

      if (existingActiveCouple) {
        activeCoupleId = existingActiveCouple.id;
        partnerId =
          existingActiveCouple.user1Id === user.id
            ? existingActiveCouple.user2Id
            : existingActiveCouple.user1Id;

        updatePayload.couple = { connect: { id: activeCoupleId } };
        if (partnerId) {
          updatePayload.partner = { connect: { id: partnerId } };
        }
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: updatePayload,
      });
    }

    const tokens = await this.generateTokens(user.id, activeCoupleId);

    return {
      ...tokens,
      coupleId: activeCoupleId,
      user: {
        id: user.id,
        email: (updatePayload.email as string) || user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        coupleId: activeCoupleId,
        partnerId: partnerId || user.partnerId,
        timezone: user.timezone,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy phiên đăng nhập.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        coupleId?: string | null;
      }>(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'lovevault_super_secret_refresh_key_2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          coupleId: true,
          partnerId: true,
          timezone: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Tài khoản không còn tồn tại.');
      }

      const tokens = await this.generateTokens(user.id, user.coupleId);
      return {
        ...tokens,
        coupleId: user.coupleId,
        user,
      };
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      );
    }
  }

  async forgotPassword(rawEmail: string) {
    const email = this.normalizeAndValidateEmail(rawEmail, false);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { canonicalEmail: email }],
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email nếu tài khoản tồn tại.',
      };
    }

    const now = Date.now();
    const existingEntry = this.otpCache.get(email);

    let targetOtp: string;

    if (existingEntry && existingEntry.expiresAt > now) {
      const timeSinceLastSent = now - existingEntry.lastSentAt;
      const cooldownMs = 2 * 60 * 1000;

      if (timeSinceLastSent < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - timeSinceLastSent) / 1000);
        throw new BadRequestException(
          `Vui lòng đợi ${remainingSec} giây trước khi yêu cầu gửi lại mã OTP.`,
        );
      }

      targetOtp = existingEntry.otp;
      existingEntry.lastSentAt = now;
    } else {
      targetOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await argon2.hash(targetOtp);

      this.otpCache.set(email, {
        otp: targetOtp,
        otpHash,
        expiresAt: now + 5 * 60 * 1000,
        lastSentAt: now,
      });
    }

    await this.mailService.sendResetPasswordOtp(user.email, targetOtp);

    return {
      message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email nếu tài khoản tồn tại.',
    };
  }

  async resetPasswordWithOtp(rawEmail: string, otp: string, newPassword: string) {
    const email = this.normalizeAndValidateEmail(rawEmail, false);

    if (!otp || otp.length !== 6) {
      throw new BadRequestException('Mã OTP phải bao gồm đúng 6 chữ số.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Mật khẩu mới phải từ 8 ký tự trở lên.');
    }

    const otpEntry = this.otpCache.get(email);
    if (!otpEntry || otpEntry.expiresAt < Date.now()) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại yêu cầu OTP mới.',
      );
    }

    const isOtpValid = await argon2.verify(otpEntry.otpHash, otp);
    if (!isOtpValid) {
      throw new BadRequestException('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { canonicalEmail: email }],
      },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại trên hệ thống.');
    }

    this.otpCache.delete(email);

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }
}