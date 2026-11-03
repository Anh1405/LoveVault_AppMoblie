import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TimeCapsuleService } from './time-capsule.service';
import { TimeCapsuleController } from './time-capsule.controller';
import { TimeCapsuleProcessor } from './time-capsule.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'time-capsule-queue',
    }),
  ],
  controllers: [TimeCapsuleController],
  providers: [TimeCapsuleService, TimeCapsuleProcessor],
})
export class TimeCapsuleModule {}