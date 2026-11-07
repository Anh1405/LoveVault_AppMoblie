// src/couple/couple.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoupleService } from './couple.service';
import { CoupleController } from './couple.controller';
import { QaGateway } from './qa.gateway';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_ACCESS_SECRET') ||
          config.get<string>('JWT_SECRET') ||
          'lovevault_secret_key',
      }),
    }),
  ],
  controllers: [CoupleController],
  providers: [CoupleService, QaGateway],
  exports: [CoupleService],
})
export class CoupleModule {}
