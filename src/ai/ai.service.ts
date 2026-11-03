import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateReminderDto } from './ai.controller';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async generateReminder(dto: GenerateReminderDto): Promise<{ message: string }> {
    const title = dto.title?.trim() || 'kỷ niệm đặc biệt';
    const partnerName = dto.partnerName?.trim() || 'Người thương';
    const daysCount =
      typeof dto.daysUntilEvent === 'number' && Number.isFinite(dto.daysUntilEvent)
        ? dto.daysUntilEvent
        : 1;
    const tone = dto.tone || 'FUNNY';

    const promptText =
      dto.prompt?.trim() ||
      `Viết 1 câu nhắc nhở ngắn gọn (dưới 28 từ, không dùng dấu ngoặc kép, tối đa 1 emoji, không xưng là AI) về dịp "${title}" (còn ${daysCount} ngày) dành cho cặp đôi với "${partnerName}".`;

    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_AI_API_KEY') ||
      process.env.GEMINI_API_KEY;

    // 1. Gọi Google Gemini API nếu trên Render / .env đã cấu hình GEMINI_API_KEY
    if (apiKey && apiKey.trim()) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey.trim(),
        )}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 100,
            },
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText && typeof aiText === 'string') {
            return {
              message: aiText.replace(/^["']|["']$/g, '').trim(),
            };
          }
        }
      } catch {
        // Nếu gọi Gemini lỗi hoặc hết quota thì chuyển sang câu nhắc tự nhiên bên dưới
      }
    }

    // 2. Fallback thông minh ngay trên Server (luôn trả về 200 OK để không bao giờ báo lỗi đỏ)
    const timeText =
      daysCount === 0
        ? `Hôm nay là ${title}`
        : daysCount === 1
          ? `Ngày mai là ${title}`
          : `Còn ${daysCount} ngày nữa đến ${title}`;

    const pool: Record<string, string[]> = {
      FUNNY: [
        `${timeText}, nhớ lên lịch hẹn trước với ${partnerName} kẻo quên nhé!`,
        `${timeText} rồi, chuẩn bị trà sữa hoặc món ngon cho ${partnerName} thôi nào.`,
      ],
      GIFT_HINT: [
        `${timeText}. Chuẩn bị một món quà nhỏ bất ngờ cho ${partnerName} nhé!`,
        `${timeText}, đừng quên chọn sẵn quà hoặc đồ uống ${partnerName} yêu thích nha.`,
      ],
      ROMANTIC: [
        `${timeText}. Dành một buổi tối thật ấm áp và trọn vẹn bên ${partnerName} nhé.`,
        `${timeText}, nhớ gửi một lời chúc thật ngọt ngào đến ${partnerName}.`,
      ],
      SASSY: [
        `${timeText}. Quên lịch này là tốn một phiếu hẹn đền bù cho ${partnerName} đấy nha!`,
        `${timeText}, nhớ chốt kèo đi chơi sớm với ${partnerName} nhé.`,
      ],
    };

    const selectedList = pool[tone] || pool.FUNNY;
    const seed = (new Date().getDate() + daysCount) % selectedList.length;

    return {
      message: selectedList[seed],
    };
  }
}
