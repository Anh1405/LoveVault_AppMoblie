// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CheckEmailDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordWithOtpDto,
} from './dto/auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  private readonly idempotencyCache = new Map<
    string,
    { expiresAt: number; promise: Promise<any> }
  >();

  constructor(private readonly authService: AuthService) {}

  private executeWithIdempotency<T>(
    idempotencyKey: string | undefined,
    action: () => Promise<T>,
  ): Promise<T> {
    if (!idempotencyKey) {
      return action();
    }

    const now = Date.now();
    for (const [key, entry] of this.idempotencyCache.entries()) {
      if (entry.expiresAt <= now) {
        this.idempotencyCache.delete(key);
      }
    }

    const existing = this.idempotencyCache.get(idempotencyKey);
    if (existing && existing.expiresAt > now) {
      return existing.promise;
    }

    const promise = action().catch((err) => {
      this.idempotencyCache.delete(idempotencyKey);
      throw err;
    });

    this.idempotencyCache.set(idempotencyKey, {
      expiresAt: now + 30_000,
      promise,
    });

    return promise;
  }

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.executeWithIdempotency(idempotencyKey, () =>
      this.authService.register(dto),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.executeWithIdempotency(idempotencyKey, () =>
      this.authService.login(dto),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('check-email')
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmailAvailability(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordWithOtpDto) {
    return this.authService.resetPasswordWithOtp(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
  }
}