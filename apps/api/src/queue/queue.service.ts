import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
  });

  readonly ordersQueue = new Queue('orders', { connection: this.connection });

  async onModuleDestroy() {
    await this.ordersQueue.close();
    await this.connection.quit();
  }
}
