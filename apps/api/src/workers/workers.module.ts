import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReconciliationProcessor } from './reconciliation.processor';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    PaymentsModule,
    BullModule.registerQueue({ name: 'reconciliation' }),
  ],
  providers: [ReconciliationProcessor],
})
export class WorkersModule implements OnModuleInit {
  constructor(private processor: ReconciliationProcessor) {}

  async onModuleInit() {
    await this.processor.schedule();
  }
}