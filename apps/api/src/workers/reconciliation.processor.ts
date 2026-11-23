import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
@Processor('reconciliation')
export class ReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  constructor(
    private payments: PaymentsService,
    @InjectQueue('reconciliation') private queue: Queue,
  ) {
    super();
  }

  async schedule() {
    await this.queue.add(
      'reconcile',
      {},
      {
        repeat: { every: 60 * 60 * 1000 },
        removeOnComplete: true,
      },
    );
  }

  async process(job: Job): Promise<unknown> {
    if (job.name === 'reconcile') {
      const result = await this.payments.reconcilePending();
      this.logger.log(`Reconciled ${result.reconciled} payments`);
      return result;
    }
    return null;
  }
}