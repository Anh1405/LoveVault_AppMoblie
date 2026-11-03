// src/main.ts
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Kích hoạt ValidationPipe & Class-Transformer tự động lọc dấu cách thừa trong DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true, // BẮT BUỘC: Kích hoạt @Transform() trong auth.dto.ts trước khi kiểm tra @IsEmail()
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const constraints = firstError?.constraints;
        const firstMessage = constraints
          ? Object.values(constraints)[0]
          : 'Dữ liệu gửi lên không hợp lệ.';
        return new BadRequestException(firstMessage);
      },
    }),
  );

  // 2. Cho phép Cross-Origin Requests kèm các Header của Mobile App
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'Idempotency-Key',
      'X-Device-Id',
      'X-Timezone',
    ],
  });

  // 3. Đảm bảo Prisma đóng kết nối PostgreSQL an toàn khi dừng Server
  app.enableShutdownHooks();

  // 4. Lắng nghe trên IP '0.0.0.0'
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Server running at http://localhost:${port} and LAN IP`);
}

bootstrap();