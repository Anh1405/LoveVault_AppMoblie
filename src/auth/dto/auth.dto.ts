// src/auth/dto/auth.dto.ts
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

const stripAllSpacesAndLower = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  return value.replace(/[\s\u200B-\u200D\uFEFF]+/g, '').toLowerCase();
};

const normalizeTextSpaces = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
};

export class RegisterDto {
  @Transform(({ value }) => stripAllSpacesAndLower(value))
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ email.' })
  @MaxLength(255, { message: 'Địa chỉ email không được vượt quá 255 ký tự.' })
  email!: string;

  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @MinLength(8, { message: 'Mật khẩu cần đạt độ dài từ 8 ký tự trở lên.' })
  @MaxLength(128, { message: 'Mật khẩu không được vượt quá 128 ký tự.' })
  password!: string;

  @Transform(({ value }) => normalizeTextSpaces(value))
  @IsString({ message: 'Tên hiển thị không hợp lệ.' })
  @IsNotEmpty({ message: 'Tên hiển thị không được bỏ trống.' })
  @MinLength(2, { message: 'Tên hiển thị phải có ít nhất 2 ký tự.' })
  @MaxLength(100, { message: 'Tên hiển thị không được vượt quá 100 ký tự.' })
  fullName!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

export class LoginDto {
  @Transform(({ value }) => stripAllSpacesAndLower(value))
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ email.' })
  email!: string;

  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @IsNotEmpty({ message: 'Mật khẩu không được bỏ trống.' })
  password!: string;
}

export class CheckEmailDto {
  @Transform(({ value }) => stripAllSpacesAndLower(value))
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ email.' })
  email!: string;
}

export class RefreshTokenDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Refresh Token không được bỏ trống.' })
  refreshToken!: string;
}

export class OAuthLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Thiếu mã xác thực từ nhà cung cấp (idToken).' })
  idToken!: string;

  @IsOptional()
  @IsIn(['GOOGLE', 'APPLE'], { message: 'Nhà cung cấp không hợp lệ.' })
  provider?: 'GOOGLE' | 'APPLE';

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

export class ForgotPasswordDto {
  @Transform(({ value }) => stripAllSpacesAndLower(value))
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ email.' })
  email!: string;
}

export class ResetPasswordWithOtpDto {
  @Transform(({ value }) => stripAllSpacesAndLower(value))
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ email.' })
  email!: string;

  @IsString({ message: 'Mã OTP không hợp lệ.' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã OTP.' })
  @Length(6, 6, { message: 'Mã OTP phải bao gồm đúng 6 chữ số.' })
  otp!: string;

  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @MinLength(8, { message: 'Mật khẩu mới phải từ 8 ký tự trở lên.' })
  @MaxLength(128, { message: 'Mật khẩu không được vượt quá 128 ký tự.' })
  newPassword!: string;
}