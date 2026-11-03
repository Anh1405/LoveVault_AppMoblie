import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('time-capsule-queue')
export class TimeCapsuleProcessor extends WorkerHost {
  private readonly logger = new Logger(TimeCapsuleProcessor.name);

  async process(job: Job<{ capsuleId: string; coupleId: string }>): Promise<any> {
    this.logger.log(`🚀 Xử lý mở thư thời gian ID: ${job.data.capsuleId} cho Cặp đôi: ${job.data.coupleId}`);
    
    // Logic gửi Push Notification qua FCM / APNs cho 2 người trong cặp đôi ở đây
    return { status: 'NOTIFIED', capsuleId: job.data.capsuleId };
  }
}