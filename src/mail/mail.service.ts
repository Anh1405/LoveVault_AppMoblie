// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendResetPasswordOtp(toEmail: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_FROM || `"LoveVault" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: '[LoveVault] Mã OTP khôi phục mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #E53E3E; text-align: center; margin-bottom: 8px;">LoveVault</h2>
          <p style="color: #4A5568; font-size: 14px; text-align: center; margin-top: 0;">Không gian lưu trữ khoảnh khắc lứa đôi</p>
          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;" />
          <p style="color: #2D3748; font-size: 15px;">Xin chào,</p>
          <p style="color: #4A5568; font-size: 14px; line-height: 22px;">Bạn đã gửi yêu cầu đặt lại mật khẩu cho tài khoản LoveVault. Mã OTP xác thực của bạn là:</p>
          <div style="background-color: #FFF5F5; border: 1px dashed #FEB2B2; padding: 16px; text-align: center; margin: 24px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #E53E3E;">${otp}</span>
          </div>
          <p style="color: #718096; font-size: 13px; line-height: 18px;">Mã OTP này có hiệu lực trong <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn tài khoản.</p>
          <hr style="border: none; border-top: 1px solid #edf2f7; margin: 24px 0;" />
          <p style="color: #A0AEC0; font-size: 12px; text-align: center; margin: 0;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Đã gửi email OTP thành công tới: ${toEmail}`);
    } catch (error) {
      this.logger.error(`Thất bại khi gửi email OTP tới ${toEmail}:`, error);
      throw error;
    }
  }
}